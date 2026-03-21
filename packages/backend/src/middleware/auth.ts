// ===================================================
// Flavos IA 3.0 — Auth Middleware
// Verifies Firebase ID token via Identity Toolkit REST API.
// Works without a service account — only needs VITE_FIREBASE_API_KEY.
// ===================================================

import type { Request, Response, NextFunction } from 'express';
import { audit } from './logger.js';

export interface AuthenticatedRequest extends Request {
  uid?: string;
}

async function verifyFirebaseToken(token: string): Promise<string> {
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('VITE_FIREBASE_API_KEY não configurada no .env');

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
  });

  if (!res.ok) {
    let errMsg = 'Token inválido';
    try { const e = await res.json() as any; errMsg = e?.error?.message || errMsg; } catch { /* ignore */ }
    throw new Error(errMsg);
  }

  const data = await res.json() as any;
  const user = data.users?.[0];
  if (!user?.localId) throw new Error('Usuário não encontrado');

  return user.localId as string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const ip = req.ip ?? req.socket.remoteAddress ?? '';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    audit('auth_failure', { route: req.path, status: 401, ip, detail: 'Token ausente' });
    res.status(401).json({ error: 'Não autorizado — token ausente.' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    req.uid = await verifyFirebaseToken(token);
    next();
  } catch (err: any) {
    audit('auth_failure', { route: req.path, status: 401, ip, detail: err?.message });
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}
