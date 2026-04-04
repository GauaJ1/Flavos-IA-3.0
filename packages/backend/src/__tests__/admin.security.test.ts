// ===================================================
// Integration tests — Admin Security (HTTP layer)
//
// Testa proteções que ocorrem ANTES do Firestore ser acessado.
// Usa um app Express isolado que monta apenas o adminRouter.
//
// Comportamentos verificados:
//   - CLEANUP_SECRET ausente → 503 (endpoint desabilitado)
//   - Header ausente/malformado → 401 (se secret configurado)
//   - Token incorreto → 403
//   - Verbos não-POST → 405 (enforcePostOnly via router.all)
//   - Rotas desconhecidas → 404
//   - Respostas nunca vazam detalhes internos
// ===================================================

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { requestIdMiddleware } from '../middleware/requestId.js';
import adminRouter from '../routes/admin.js';

// ── App de teste isolado — sem server.ts para evitar side effects ─────
const testApp = express();
testApp.use(requestIdMiddleware);
testApp.use(express.json({ limit: '512kb' }));

const adminLimiter = rateLimit({
  windowMs: 60_000,
  max: 200, // alto para não interferir nos testes
  standardHeaders: true,
  legacyHeaders: false,
});

testApp.use('/api/admin', adminLimiter, adminRouter);
// ─────────────────────────────────────────────────────────────────────

// Em ambiente de teste, CLEANUP_SECRET geralmente não está configurado.
// O comportamento seguro nesses casos é 503 (endpoint desabilitado).
const SECRET_CONFIGURED = !!(
  process.env.CLEANUP_SECRET && process.env.CLEANUP_SECRET.length >= 32
);

describe('POST /api/admin/cleanup-trash — CLEANUP_SECRET ausente', () => {
  it('retorna 503 quando CLEANUP_SECRET não está configurado no ambiente', async () => {
    if (SECRET_CONFIGURED) return; // pula se secret estiver configurado

    const res = await request(testApp)
      .post('/api/admin/cleanup-trash')
      .send({});

    // 503 = endpoint desabilitado por configuração ausente (comportamento correto)
    expect(res.status).toBe(503);
  });

  it('nunca vaza CLEANUP_SECRET, stack trace ou info de infraestrutura', async () => {
    const res = await request(testApp)
      .post('/api/admin/cleanup-trash')
      .set('Authorization', 'Bearer qualquer-coisa-invalida')
      .send({});

    // Aceita qualquer código de erro — não importa qual, importa o que NÃO existe na resposta
    expect([401, 403, 503]).toContain(res.status);
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/CLEANUP_SECRET/i);
    expect(body).not.toMatch(/at\s+\w/);      // sem stack frames
    expect(body).not.toMatch(/firebase/i);     // sem infra interna
    expect(body).not.toMatch(/privateKey/i);   // sem credenciais
  });
});

describe('POST /api/admin/cleanup-trash — Autenticação (com SECRET configurado)', () => {
  it('retorna 401 quando Authorization header está ausente', async () => {
    if (!SECRET_CONFIGURED) {
      // Sem secret, o endpoint retorna 503 antes de chegar no check de auth
      // Verificamos que a resposta é de erro (503) — proteção mantida
      const res = await request(testApp)
        .post('/api/admin/cleanup-trash')
        .send({});
      expect(res.status).toBe(503);
      return;
    }

    const res = await request(testApp)
      .post('/api/admin/cleanup-trash')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).not.toMatch(/SECRET/i);
  });

  it('retorna 401 quando header tem formato inválido (Basic em vez de Bearer)', async () => {
    if (!SECRET_CONFIGURED) {
      const res = await request(testApp)
        .post('/api/admin/cleanup-trash')
        .set('Authorization', 'Basic dXNlcjpwYXNz')
        .send({});
      expect(res.status).toBe(503);
      return;
    }

    const res = await request(testApp)
      .post('/api/admin/cleanup-trash')
      .set('Authorization', 'Basic dXNlcjpwYXNz')
      .send({});

    expect(res.status).toBe(401);
  });

  it('retorna 403 quando token está errado (se secret configurado)', async () => {
    const res = await request(testApp)
      .post('/api/admin/cleanup-trash')
      .set('Authorization', 'Bearer wrong-secret-completely-different-xyzabc')
      .send({});

    // 503 se secret ausente, 403 se secret correto mas token errado
    expect([403, 503]).toContain(res.status);
  });
});

describe('POST /api/admin/cleanup-trash — Método HTTP (router.all)', () => {
  // enforcePostOnly está registrado via router.all() — todos os verbos passam por ele

  it('retorna 405 quando método GET é usado', async () => {
    const res = await request(testApp).get('/api/admin/cleanup-trash');
    // enforcePostOnly via router.all() deve interceptar antes de qualquer 404
    expect(res.status).toBe(405);
    expect(res.body.error).toMatch(/method not allowed/i);
  });

  it('retorna 405 quando método PUT é usado', async () => {
    const res = await request(testApp)
      .put('/api/admin/cleanup-trash')
      .send({});
    expect(res.status).toBe(405);
  });

  it('retorna 405 quando método DELETE é usado', async () => {
    const res = await request(testApp).delete('/api/admin/cleanup-trash');
    expect(res.status).toBe(405);
  });

  it('retorna 405 quando método PATCH é usado', async () => {
    const res = await request(testApp).patch('/api/admin/cleanup-trash').send({});
    expect(res.status).toBe(405);
  });
});

describe('/api/admin — Rotas inexistentes (catch-all)', () => {
  it('retorna 404 para rota admin desconhecida (POST)', async () => {
    const res = await request(testApp)
      .post('/api/admin/inexistente')
      .set('Authorization', 'Bearer anything');

    expect(res.status).toBe(404);
  });

  it('retorna 404 ou 405 para rota admin desconhecida (GET)', async () => {
    const res = await request(testApp).get('/api/admin/delete-all-users');
    // 404 = rota não existe (nenhum router.all para esta path)
    // Ambos indicam que a rota não foi processada
    expect([404, 405]).toContain(res.status);
  });
});
