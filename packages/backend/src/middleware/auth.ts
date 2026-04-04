// ===================================================
// Flavos IA 3.0 — Auth Middleware
// Verifica Firebase ID token via Identity Toolkit REST API.
// Não requer service account — usa apenas VITE_FIREBASE_API_KEY.
// ===================================================

import type { Request, Response, NextFunction } from 'express';
import { audit } from './logger.js';

export interface AuthenticatedRequest extends Request {
  uid?: string;
}

// Timeout para requisição ao Firebase Identity Toolkit.
// Sem timeout, uma lentidão no Firebase deixa a requisição pendurada indefinidamente.
const FIREBASE_TIMEOUT_MS = 5_000;

async function verifyFirebaseToken(token: string): Promise<string> {
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('VITE_FIREBASE_API_KEY não configurada no .env');

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;

  const abortCtrl = new AbortController();
  const timeoutId = setTimeout(() => abortCtrl.abort(), FIREBASE_TIMEOUT_MS);

  let response: Response;
  try {
    // AbortController.signal cancela a fetch após FIREBASE_TIMEOUT_MS ms
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
      signal: abortCtrl.signal as any,
    });

    if (!res.ok) {
      let errMsg = 'Token inválido';
      try {
        const e = await res.json() as any;
        errMsg = e?.error?.message || errMsg;
      } catch { /* ignore */ }
      throw new Error(errMsg);
    }

    const data = await res.json() as any;
    const user = data.users?.[0];
    if (!user?.localId) throw new Error('Usuário não encontrado');

    return user.localId as string;
  } finally {
    clearTimeout(timeoutId);
  }
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
    const isTimeout = err?.name === 'AbortError';
    audit('auth_failure', {
      route: req.path,
      status: 401,
      ip,
      detail: isTimeout ? 'Firebase timeout' : err?.message,
    });
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}
