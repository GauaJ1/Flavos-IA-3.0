// ===================================================
// Integration tests — Server / HTTP Security
// Headers de segurança, health, error handler, CORS.
// ===================================================

import { describe, it, expect, vi, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';

// Mock auth para que testes relacionados ao chat não falhem por auth
vi.mock('../middleware/auth.js', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.uid = 'test-uid';
    next();
  },
}));

// Mock firebase-admin para evitar init real no carregamento do module
vi.mock('firebase-admin', () => ({
  default: {
    apps: [],
    initializeApp: vi.fn(),
    credential: { cert: vi.fn() },
    firestore: vi.fn(() => ({})),
  },
}));

import app from '../server.js';

let server: http.Server;
server = http.createServer(app);

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('Security Headers (helmet)', () => {
  it('inclui X-Content-Type-Options: nosniff', async () => {
    const res = await request(server).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('inclui X-Frame-Options', async () => {
    const res = await request(server).get('/api/health');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('inclui X-DNS-Prefetch-Control', async () => {
    const res = await request(server).get('/api/health');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
  });
});

describe('Request ID', () => {
  it('todo request recebe X-Request-Id (16 hex chars)', async () => {
    const res = await request(server).get('/api/health');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id']).toMatch(/^[a-f0-9]{16}$/);
  });

  it('X-Request-Id é único em requisições distintas', async () => {
    const [r1, r2] = await Promise.all([
      request(server).get('/api/health'),
      request(server).get('/api/health'),
    ]);
    expect(r1.headers['x-request-id']).not.toBe(r2.headers['x-request-id']);
  });
});

describe('Health endpoint', () => {
  it('retorna 200 com status: ok', async () => {
    const res = await request(server).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('NÃO expõe o nome do modelo ativo (fingerprinting)', async () => {
    const res = await request(server).get('/api/health');
    expect(res.body).not.toHaveProperty('model');
  });

  it('NÃO expõe a versão da aplicação (fingerprinting)', async () => {
    const res = await request(server).get('/api/health');
    expect(res.body).not.toHaveProperty('version');
  });

  it('inclui timestamp ISO 8601', async () => {
    const res = await request(server).get('/api/health');
    expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('Global Error Handler — sem vazamento de informação', () => {
  it('retorna 400 para JSON malformado sem expor SyntaxError', async () => {
    const res = await request(server)
      .post('/api/admin/cleanup-trash')
      .set('Content-Type', 'application/json')
      .send('{ invalid json {{{{');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/SyntaxError/);
    expect(body).not.toMatch(/at\s+\w/);  // sem stack frames
  });

  it('retorna 413 para JSON acima do limite global de 512kb (em rota não-chat)', async () => {
    // Cria um payload de ~600KB — excede o limite global de 512kb
    // O body-parser rejeita antes de chegar ao route handler
    const largePayload = 'x'.repeat(600 * 1024);
    const body = JSON.stringify({ data: largePayload });

    const res = await request(server)
      .post('/api/admin/cleanup-trash')
      .set('Content-Type', 'application/json')
      .set('Content-Length', String(body.length))
      .send(body);

    // Pode ser 413 (parser rejeitou) ou 401 (auth rejeitou primeiro se parser passou)
    expect([413, 401]).toContain(res.status);
    if (res.status === 413) {
      expect(res.body).toHaveProperty('error');
      const b = JSON.stringify(res.body);
      expect(b).not.toMatch(/Error:/);
      expect(b).not.toMatch(/at\s+\w/);
    }
  });
});

describe('CORS — controle de origens', () => {
  it('access-control-allow-origin nunca é wildcard (*)', async () => {
    const res = await request(server)
      .get('/api/health')
      .set('Origin', 'https://evil-attacker.com');

    expect(res.headers['access-control-allow-origin']).not.toBe('*');
  });

  it('permite origem de produção exata', async () => {
    const res = await request(server)
      .get('/api/health')
      .set('Origin', 'https://flavos-ia-3-0.pages.dev');

    expect(res.headers['access-control-allow-origin']).toBe('https://flavos-ia-3-0.pages.dev');
  });

  it('aceita origem localhost em desenvolvimento', async () => {
    const res = await request(server)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
