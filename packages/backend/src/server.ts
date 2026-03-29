// ===================================================
// Flavos IA 3.0 — Express Server
// ===================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import chatRouter from './routes/chat.js';
import adminRouter from './routes/admin.js';

// Carrega variáveis de ambiente
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Trust the first proxy (e.g., Nginx, Vercel) so `req.ip` is correct and rate limiters work natively.
app.set('trust proxy', 1);

// ===================================================
// Middlewares
// ===================================================

// CORS — permite requisições do frontend e mobile na mesma rede
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps)
      // or from localhost/local IP addresses
      if (
        !origin || 
        origin.includes('localhost') || 
        origin.startsWith('http://192.168.') || 
        origin.startsWith('http://10.') ||
        origin.endsWith('.pages.dev') || // Cloudflare Pages preview/branch
        origin === 'https://flavos-ia.pages.dev' // Domínio final Cloudflare
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

// JSON body parser — limite elevado para suportar imagens em base64 (inline)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// TODO: Firebase — Adicionar middleware de autenticação
// import { authMiddleware } from './middleware/auth.js';
// app.use('/api', authMiddleware);

// ===================================================
// Routes
// ===================================================

import { audit } from './middleware/logger.js';

// Rate limiting — max 30 mensagens por minuto por IP (Camada 1 — sem autenticação)
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
app.use('/api/chat', chatLimiter);
app.use('/api/chat', chatRouter);

// Admin — rate limit ultra-restrito (3 req/min)
// Protege contra brute-force do CLEANUP_SECRET
// NUNCA expor este endpoint publicamente — apenas cron jobs autorizados
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
app.use('/api/admin', adminLimiter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    model: process.env.GEMINI_MODEL || 'gemini-3.1-flash',
    timestamp: new Date().toISOString(),
  });
});

// ===================================================
// Start Server
// ===================================================

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ═══════════════════════════════════════════');
  console.log(`   Flavos IA 3.0 — Backend Proxy`);
  console.log(`   Servidor rodando em: http://0.0.0.0:${PORT} (acessível na rede local)`);
  console.log(`   Modelo: ${process.env.GEMINI_MODEL || 'gemini-3.1-flash'}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log('═══════════════════════════════════════════════');
  console.log('');

  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY não configurada!');
    console.warn('   Crie um arquivo .env na raiz do monorepo com:');
    console.warn('   GEMINI_API_KEY=sua_chave_aqui');
    console.warn('');
  }
});

export default app;
