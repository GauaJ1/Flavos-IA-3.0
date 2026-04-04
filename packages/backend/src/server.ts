// ===================================================
// Flavos IA 3.0 — Express Server
// ===================================================

import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import chatRouter from './routes/chat.js';
import adminRouter from './routes/admin.js';
import { audit } from './middleware/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Proxy trust: req.ip reflete o IP real do cliente atrás de Nginx/Cloudflare
app.set('trust proxy', 1);

// ===================================================
// Middleware de infraestrutura — ordem importa
// ===================================================

// 1. Request ID — primeiro de todos para estar disponível em qualquer log
app.use(requestIdMiddleware);

// 2. Security headers via helmet
//    Content-Security-Policy não definida aqui pois este é um backend de API,
//    não serve HTML. Os defaults do helmet são seguros para APIs JSON.
app.use(helmet());

// 3. CORS — allowlist explícita, sem wildcard
//    !origin: mobile apps e curl legítimos não enviam Origin header
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.includes('localhost') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.') ||
        origin.startsWith('http://15.') ||
        origin === 'https://flavos-ia-3-0.pages.dev'
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ===================================================
// Body Parsers — estratégia em camadas
//
// ORDEM OBRIGATÓRIA:
//   1. /api/chat com parser dedicado (10mb) → registrado PRIMEIRO
//   2. parsers globais (512kb) → body-parser pula se req._body === true
//   3. demais rotas
//
// Por que funciona: body-parser marca req._body = true após parsear.
// O parser global rodando depois vê a flag e chama next() sem re-parsear.
// Logo, o limite de 512kb NÃO afeta requisições de chat que chegam com base64.
// ===================================================

// Parser dedicado para chat (imagens em base64)
const chatBodyParser = express.json({ limit: '10mb' });

// Rate limit por IP — Camada 1 do chat (Camada 2 por UID fica no router)
const chatLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    audit('rate_limit_ip', { route: req.path, status: 429, ip: req.ip ?? '' });
    res.status(429).json({ error: 'Muitas requisições. Tente novamente em alguns segundos.' });
  },
});

// /api/chat: parser 10mb + rate limit + router — ANTES dos parsers globais
app.use('/api/chat', chatBodyParser, chatLimiter, chatRouter);

// Parsers globais para admin, health e rotas futuras
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ limit: '256kb', extended: true }));

// ===================================================
// Admin
// ===================================================

// 3 req/min — protege contra brute-force do CLEANUP_SECRET
const adminLimiter = rateLimit({
  windowMs: 60_000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    audit('admin_rate_limit', {
      route: req.path,
      status: 429,
      ip: req.ip ?? '',
      detail: 'Rate limit excedido — possível tentativa de brute-force.',
    });
    res.status(429).json({ error: 'Too many requests.' });
  },
});

app.use('/api/admin', adminLimiter, adminRouter);

// ===================================================
// Health check
// ===================================================
// Não expõe modelo, versão ou stack — evita fingerprinting
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===================================================
// Global Error Handler
// ===================================================
// Deve ser o ÚLTIMO middleware registrado.
// Captura erros lançados por body-parser, CORS e rotas.
// NUNCA envia stack trace ao cliente em produção.
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const ip = req.ip ?? '';

  if (err.type === 'entity.too.large') {
    audit('payload_too_large', { route: req.path, status: 413, ip });
    res.status(413).json({ error: 'Payload muito grande.' });
    return;
  }

  if (err.type === 'entity.parse.failed') {
    audit('json_parse_error', { route: req.path, status: 400, ip });
    res.status(400).json({ error: 'JSON inválido.' });
    return;
  }

  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'CORS: origem não permitida.' });
    return;
  }

  audit('unhandled_error', {
    route: req.path,
    status: err.status ?? err.statusCode ?? 500,
    ip,
    detail: String(err?.message ?? '').slice(0, 200),
  });

  res.status(err.status ?? err.statusCode ?? 500).json({ error: 'Erro interno do servidor.' });
});

// ===================================================
// Start Server
// ===================================================
// Guard: listen() só é chamado quando este arquivo é executado diretamente.
// Quando importado como módulo (testes), app é exportado sem subir o servidor,
// evitando conflito de porta e race conditions nos testes.

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

if (!isTest) {
  app.listen(Number(PORT), '0.0.0.0', () => {
    process.stdout.write(
      JSON.stringify({
        event: 'server_start',
        ts: new Date().toISOString(),
        port: PORT,
        env: process.env.NODE_ENV ?? 'development',
      }) + '\n'
    );
    if (!process.env.GEMINI_API_KEY) {
      audit('startup_warning', { detail: 'GEMINI_API_KEY não configurada.' });
    }
    if (!process.env.VITE_FIREBASE_API_KEY) {
      audit('startup_warning', { detail: 'VITE_FIREBASE_API_KEY não configurada.' });
    }
  });
}

export default app;
