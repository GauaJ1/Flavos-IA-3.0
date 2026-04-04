// ===================================================
// Flavos IA 3.0 — Request ID Middleware
// Gera um ID único por requisição para correlação de logs.
// O ID é exposto no header X-Request-Id da resposta.
// ===================================================

import { randomBytes } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export interface RequestWithId extends Request {
  requestId?: string;
}

export function requestIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void {
  const id = randomBytes(8).toString('hex'); // 16 chars hex — não sequencial, não adivinhável
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
