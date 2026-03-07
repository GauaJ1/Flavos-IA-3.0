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

// CORS — permite requisições do frontend (Vite dev server)
app.use(
  cors({
    origin: [
      'http://localhost:5173', // Vite dev
      'http://localhost:3000', // Produção local
      'http://localhost:19006', // Expo web
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// JSON body parser
app.use(express.json({ limit: '1mb' }));

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

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ═══════════════════════════════════════════');
  console.log(`   Flavos IA 3.0 — Backend Proxy`);
  console.log(`   Servidor rodando em: http://localhost:${PORT}`);
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
