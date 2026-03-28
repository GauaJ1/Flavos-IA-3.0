// ===================================================
// Flavos IA 3.0 — Admin Routes (HARDENED)
//
// ROTA CRÍTICA DE PRODUÇÃO
// Endpoint de manutenção protegido por Bearer secret.
// NUNCA expor no cliente, NUNCA chamar de frontend.
// Apenas cron jobs autorizados (cron-job.org, Railway, etc).
//
// Camadas de proteção:
//   1. Rate limit ultra-restrito (server.ts: 3 req/min)
//   2. Método estrito (POST only)
//   3. Autenticação via Bearer token com comparação timing-safe
//   4. Validação defensiva de dados antes de qualquer delete
//   5. Limite por execução (max 100 conversas)
//   6. Log de auditoria estruturado (sem vazar secrets)
//   7. Tratamento de erro por conversa (nunca derrubar o batch inteiro)
//
// Usa Firebase Admin SDK (não o SDK modular do cliente).
// ===================================================

import { Router, Request, Response } from 'express';
import { timingSafeEqual, randomBytes } from 'crypto';
import admin from 'firebase-admin';
import { audit } from '../middleware/logger.js';

const router = Router();

// =====================================================
// Constantes de segurança
// =====================================================
const FOUR_DAYS_MS     = 4 * 24 * 60 * 60 * 1000;
const BATCH_LIMIT      = 100;   // max conversas por rodada
const FIRESTORE_BATCH  = 500;   // max operações por batch do Firestore
const MIN_SECRET_LEN   = 32;    // rejeitar secrets fracos demais

// =====================================================
// Firebase Admin init (singleton)
// =====================================================
function getAdminDb(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey:  (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin.firestore();
}

// =====================================================
// Comparação timing-safe de strings
// Previne ataques de timing side-channel que tentam
// deduzir o secret byte-a-byte medindo tempo de resposta.
// =====================================================
function secureCompare(a: string, b: string): boolean {
  // Se comprimentos diferentes, ainda executamos a comparação
  // com buffer de tamanho fixo para manter timing constante
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    // Compara bufA consigo mesmo para gastar tempo equivalente
    // e depois retorna false — timing constante garantido
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

// =====================================================
// Helper: extrai IP mascarado do request (para logs)
// =====================================================
function getClientIp(req: Request): string {
  // x-forwarded-for pode conter lista "client, proxy1, proxy2"
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() ?? '';
  return req.ip ?? req.socket?.remoteAddress ?? '';
}

// =====================================================
// Middleware: Força método POST estrito
// Rejeita qualquer outro verbo HTTP nesta rota
// =====================================================
function enforcePostOnly(req: Request, res: Response, next: () => void) {
  if (req.method !== 'POST') {
    audit('admin_method_rejected', {
      route: req.path,
      status: 405,
      ip: getClientIp(req),
      detail: `Método rejeitado: ${req.method}`,
    });
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  next();
}

// =====================================================
// Middleware: Autenticação Bearer Secret (HARDENED)
//
// Regras estritas:
//   - CLEANUP_SECRET deve existir e ter >= 32 chars
//   - Header Authorization obrigatório
//   - Formato "Bearer <token>" exato (1 espaço, sem extras)
//   - Comparação timing-safe do token
//   - NUNCA loga o secret ou o token fornecido
//   - Auth failure retorna 401 genérico (sem detalhes)
// =====================================================
function requireCleanupSecret(req: Request, res: Response, next: () => void) {
  const secret = process.env.CLEANUP_SECRET;
  const ip = getClientIp(req);

  // 1. Secret não configurado → serviço indisponível
  if (!secret || secret.length < MIN_SECRET_LEN) {
    audit('admin_secret_missing', {
      route: req.path,
      status: 503,
      ip,
      detail: 'CLEANUP_SECRET ausente ou muito curto — endpoint desabilitado.',
    });
    // Resposta vaga — não revelar detalhes de configuração interna
    res.status(503).json({ error: 'Service unavailable.' });
    return;
  }

  // 2. Header Authorization ausente
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    audit('admin_auth_missing', {
      route: req.path,
      status: 401,
      ip,
    });
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  // 3. Formato estrito: "Bearer " + token (exatamente 1 espaço)
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    audit('admin_auth_malformed', {
      route: req.path,
      status: 401,
      ip,
      detail: 'Header Authorization malformado.',
    });
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  // 4. Comparação timing-safe do token
  const providedToken = parts[1];
  if (!secureCompare(providedToken, secret)) {
    audit('admin_auth_failed', {
      route: req.path,
      status: 403,
      ip,
      detail: 'Token inválido — acesso negado.',
    });
    // 403 Forbidden — token fornecido mas incorreto
    res.status(403).json({ error: 'Forbidden.' });
    return;
  }

  // 5. Autenticação bem-sucedida
  audit('admin_auth_success', {
    route: req.path,
    status: 200,
    ip,
  });

  next();
}

// =====================================================
// POST /api/admin/cleanup-trash
//
// Apaga permanentemente conversas que:
//   1. status === 'trash'       (obrigatório)
//   2. trashedAt existe         (obrigatório — validação defensiva)
//   3. trashedAt <= 4 dias atrás (obrigatório — expiração)
//
// Limites:
//   - Max 100 conversas por execução
//   - Entries deletadas em batches de 500
//   - Erros por conversa NÃO interrompem o loop
//
// Resposta:
//   { startedAt, finishedAt, conversationsDeleted,
//     entriesDeleted, errorCount, limitPerRun, status }
//
// NUNCA retorna: conteúdo de mensagens, owners, secrets
// =====================================================
router.post('/cleanup-trash', enforcePostOnly, requireCleanupSecret, async (req: Request, res: Response) => {
  const startedAt = new Date().toISOString();
  const ip = getClientIp(req);

  let db: admin.firestore.Firestore;
  try {
    db = getAdminDb();
  } catch (err) {
    audit('admin_cleanup_db_error', {
      route: '/cleanup-trash',
      status: 500,
      ip,
      detail: `Falha ao inicializar Firebase Admin: ${(err as Error).message}`,
    });
    res.status(500).json({ error: 'Internal server error.' });
    return;
  }

  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - FOUR_DAYS_MS);
  const errors: string[] = [];
  let conversationsDeleted = 0;
  let entriesDeleted = 0;

  audit('admin_cleanup_started', {
    route: '/cleanup-trash',
    ip,
    detail: `Cutoff: ${cutoff.toDate().toISOString()}, limit: ${BATCH_LIMIT}`,
  });

  try {
    // Query: APENAS conversas com status='trash' E trashedAt <= cutoff
    const snap = await db
      .collection('conversations')
      .where('status', '==', 'trash')
      .where('trashedAt', '<=', cutoff)
      .limit(BATCH_LIMIT) // ← limitar na query, não no slice
      .get();

    audit('admin_cleanup_query', {
      route: '/cleanup-trash',
      ip,
      detail: `Conversas encontradas: ${snap.docs.length}`,
    });

    for (const convDoc of snap.docs) {
      const convId = convDoc.id;
      const convData = convDoc.data();

      // ─── VALIDAÇÃO DEFENSIVA por conversa ───────────────
      // NUNCA confiar apenas na query — revalidar cada documento

      // (V1) Status deve ser 'trash' — proteção contra race condition
      if (convData.status !== 'trash') {
        const msg = `SKIP ${convId}: status inesperado '${convData.status}' (esperado 'trash')`;
        errors.push(msg);
        audit('admin_cleanup_skip', { route: '/cleanup-trash', ip, detail: msg });
        continue;
      }

      // (V2) trashedAt deve existir e ser um Timestamp válido
      const trashedAt = convData.trashedAt;
      if (!trashedAt || !(trashedAt instanceof admin.firestore.Timestamp)) {
        const msg = `SKIP ${convId}: trashedAt ausente ou inválido`;
        errors.push(msg);
        audit('admin_cleanup_skip', { route: '/cleanup-trash', ip, detail: msg });
        continue;
      }

      // (V3) trashedAt deve ser <= cutoff (mesmo que a query filtre, revalidar)
      if (trashedAt.toMillis() > cutoff.toMillis()) {
        const msg = `SKIP ${convId}: trashedAt (${trashedAt.toDate().toISOString()}) é após o cutoff`;
        errors.push(msg);
        audit('admin_cleanup_skip', { route: '/cleanup-trash', ip, detail: msg });
        continue;
      }

      // ─── DELETE SEGURO ──────────────────────────────────
      try {
        // 1. Apagar entries da sub-coleção em batches de FIRESTORE_BATCH
        const entriesSnap = await db
          .collection('conversations')
          .doc(convId)
          .collection('entries')
          .select() // ← otimização: retorna apenas refs, sem dados
          .get();

        let entriesInConv = 0;
        if (!entriesSnap.empty) {
          for (let i = 0; i < entriesSnap.docs.length; i += FIRESTORE_BATCH) {
            const chunk = entriesSnap.docs.slice(i, i + FIRESTORE_BATCH);
            const batch = db.batch();
            for (const entryDoc of chunk) {
              batch.delete(entryDoc.ref);
            }
            await batch.commit();
            entriesInConv += chunk.length;
          }
        }

        // 2. Apagar o documento da conversa
        await convDoc.ref.delete();

        conversationsDeleted++;
        entriesDeleted += entriesInConv;

        audit('admin_cleanup_deleted', {
          route: '/cleanup-trash',
          ip,
          detail: `${convId}: ${entriesInConv} entries`,
        });

      } catch (err) {
        const msg = `ERRO ${convId}: ${(err as Error).message}`;
        errors.push(msg);
        audit('admin_cleanup_error', {
          route: '/cleanup-trash',
          ip,
          status: 500,
          detail: msg,
        });
        // Continua para a próxima conversa — nunca derrubar o loop inteiro
      }
    }

  } catch (err) {
    const msg = `Erro na query principal: ${(err as Error).message}`;
    errors.push(msg);
    audit('admin_cleanup_query_error', {
      route: '/cleanup-trash',
      ip,
      status: 500,
      detail: msg,
    });
  }

  const finishedAt = new Date().toISOString();

  // Resultado limpo — sem conteúdo de mensagens, sem owners, sem dados sensíveis
  const result = {
    startedAt,
    finishedAt,
    conversationsDeleted,
    entriesDeleted,
    errorCount: errors.length,
    limitPerRun: BATCH_LIMIT,
    status: errors.length === 0 ? 'success' : 'partial',
  };

  audit('admin_cleanup_finished', {
    route: '/cleanup-trash',
    ip,
    status: 200,
    detail: `Conversas: ${conversationsDeleted}, Entries: ${entriesDeleted}, Erros: ${errors.length}`,
  });

  res.status(200).json(result);
});

// =====================================================
// Catch-all: rejeitar qualquer outro verbo ou rota admin
// =====================================================
router.all('*', (req: Request, res: Response) => {
  audit('admin_route_rejected', {
    route: req.path,
    status: 404,
    ip: getClientIp(req),
    detail: `${req.method} ${req.path} — rota admin inexistente`,
  });
  res.status(404).json({ error: 'Not found.' });
});

export default router;
