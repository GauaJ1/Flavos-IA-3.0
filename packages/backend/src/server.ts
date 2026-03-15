// ===================================================
// Flavos IA 3.0 — Express Server
// ===================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';

// Carrega variáveis de ambiente
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// ===================================================
// Middlewares
// ===================================================

// CORS — permite requisições do frontend e mobile na mesma rede
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps)
      // or from localhost/local IP addresses
      if (!origin || origin.includes('localhost') || origin.startsWith('http://192.168.') || origin.startsWith('http://10.')) {
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

app.use('/api/chat', chatRouter);

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
