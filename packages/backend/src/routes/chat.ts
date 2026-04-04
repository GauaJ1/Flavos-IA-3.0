// ===================================================
// Flavos IA 3.0 — Chat Route (SSE Streaming Proxy)
// Security layers:
//   1. requireAuth       — Firebase ID token verification
//   2. uidLimiter        — Per-UID rate limit (20 req/min, Camada 2)
//   3. validateChatPayload — Schema + size + MIME validation (400/413/415)
//   4. History sanitization — safeHistory truncates + cleans roles
//   5. Defensive moderation — Gemini safety signals
//   6. Audit logging     — structured JSON, no sensitive data
// ===================================================

import { Router, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { genAI, GEMINI_MODEL } from '../config/gemini.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { audit } from '../middleware/logger.js';

const router = Router();

// ─────────────────────────────────────────────────
// Payload limits — exported for unit testing
// ─────────────────────────────────────────────────

export const MAX_MESSAGES = 100;
export const MAX_MSG_CHARS = 32_000;
export const MAX_TOTAL_TEXT_CHARS = 200_000;
export const MAX_ATTACHMENTS = 5;
export const MAX_USERNAME_CHARS = 100;

// 4MB decoded por attachment individual.
// 4MB decoded = ~5.3MB base64 — dentro do parser de 10mb.
export const MAX_ATTACHMENT_DECODED_BYTES = 4 * 1024 * 1024;

// 6MB decoded para o total de attachments.
// Racional: 6MB decoded = ~8MB base64 < 10mb do body parser.
// Isso garante que o validator PODE ser acionado antes do parser rejeitar.
// (8MB decoded = ~10.7MB base64 excederia o parser sem passar pelo validator)
export const MAX_TOTAL_ATTACHMENT_DECODED_BYTES = 6 * 1024 * 1024;

// Whitelist explícita de MIME types.
// Somente formatos suportados pelo Gemini como inlineData de imagem.
// SVG é explicitamente excluído — pode conter JavaScript embutido.
export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
]);

// Valida charset e padding base64.
// /^[charset]*={0,2}$/ garante no máximo 2 chars de padding.
const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Estima bytes decodificados a partir do comprimento de uma string base64.
 * base64: 4 chars → 3 bytes ⟹ decoded ≈ chars × (3/4) − padding
 * Exported para testes unitários.
 */
export function base64DecodedBytes(b64: string): number {
  const padding = (b64.match(/={1,2}$/) ?? [''])[0].length;
  return Math.floor((b64.length * 3) / 4) - padding;
}

/**
 * Valida formato estrutural de base64.
 * Não decodifica — verifica charset + múltiplo de 4 + padding máximo 2.
 * Exported para testes unitários.
 */
export function isValidBase64(str: string): boolean {
  if (!str || str.length === 0) return false;
  if (str.length % 4 !== 0) return false;
  return BASE64_RE.test(str);
}

/**
 * Middleware de validação de payload do chat.
 *
 * Retorna:
 *   400 — campo obrigatório ausente, formato inválido, base64 malformado
 *   413 — tamanho excede limites (mensagens, chars, attachments, bytes)
 *   415 — MIME type não está na whitelist
 *
 * Exported para testes unitários sem HTTP.
 */
export function validateChatPayload(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const ip = req.ip ?? '';
  const { messages, userName, attachments } = req.body ?? {};

  // ── messages ────────────────────────────────────────────────────────
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'O campo "messages" é obrigatório e deve ser um array não vazio.' });
    return;
  }

  if (messages.length > MAX_MESSAGES) {
    audit('payload_too_large', {
      uid: req.uid, route: req.path, ip, status: 413,
      detail: `messages: ${messages.length} > max ${MAX_MESSAGES}`,
    });
    res.status(413).json({ error: `Máximo de ${MAX_MESSAGES} mensagens por requisição.` });
    return;
  }

  let totalTextChars = 0;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') {
      res.status(400).json({ error: `messages[${i}]: formato inválido.` });
      return;
    }
    if (!['user', 'assistant', 'system'].includes(msg.role)) {
      res.status(400).json({ error: `messages[${i}].role inválido.` });
      return;
    }
    const content = String(msg.content ?? '');
    if (content.length > MAX_MSG_CHARS) {
      audit('payload_too_large', {
        uid: req.uid, route: req.path, ip, status: 413,
        detail: `messages[${i}].content: ${content.length} > ${MAX_MSG_CHARS}`,
      });
      res.status(413).json({ error: `Mensagem ${i + 1} excede ${MAX_MSG_CHARS.toLocaleString()} caracteres.` });
      return;
    }
    totalTextChars += content.length;
  }

  if (totalTextChars > MAX_TOTAL_TEXT_CHARS) {
    audit('payload_too_large', {
      uid: req.uid, route: req.path, ip, status: 413,
      detail: `totalTextChars: ${totalTextChars} > ${MAX_TOTAL_TEXT_CHARS}`,
    });
    res.status(413).json({ error: 'Histórico excede o tamanho máximo permitido.' });
    return;
  }

  // ── userName — sanitização anti prompt-injection ─────────────────────
  if (userName !== undefined && typeof userName !== 'string') {
    res.status(400).json({ error: 'userName deve ser uma string.' });
    return;
  }

  // ── attachments ──────────────────────────────────────────────────────
  if (attachments !== undefined) {
    if (!Array.isArray(attachments)) {
      res.status(400).json({ error: 'attachments deve ser um array.' });
      return;
    }

    if (attachments.length > MAX_ATTACHMENTS) {
      audit('payload_too_large', {
        uid: req.uid, route: req.path, ip, status: 413,
        detail: `attachments: ${attachments.length} > max ${MAX_ATTACHMENTS}`,
      });
      res.status(413).json({ error: `Máximo de ${MAX_ATTACHMENTS} arquivos por requisição.` });
      return;
    }

    let totalAttachmentBytes = 0;

    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];
      if (!att || typeof att !== 'object') {
        res.status(400).json({ error: `attachments[${i}]: formato inválido.` });
        return;
      }

      const { mimeType, base64Data } = att;

      if (!mimeType || typeof mimeType !== 'string') {
        res.status(400).json({ error: `attachments[${i}].mimeType ausente.` });
        return;
      }

      // Whitelist com normalização — rejeita tipos não permitidos com 415
      const normalizedMime = mimeType.toLowerCase().trim();
      if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
        audit('invalid_mime_type', {
          uid: req.uid, route: req.path, ip, status: 415,
          detail: `attachments[${i}].mimeType: "${mimeType}" não permitido`,
        });
        res.status(415).json({
          error: `Tipo de arquivo não suportado: "${mimeType}". Aceitos: ${[...ALLOWED_MIME_TYPES].join(', ')}.`,
        });
        return;
      }

      if (!base64Data || typeof base64Data !== 'string') {
        res.status(400).json({ error: `attachments[${i}].base64Data ausente.` });
        return;
      }

      // Validação estrutural de base64 — rejeita dados malformados sem decodar
      if (!isValidBase64(base64Data)) {
        audit('invalid_base64', {
          uid: req.uid, route: req.path, ip, status: 400,
          detail: `attachments[${i}]: base64 malformado (len=${base64Data.length})`,
        });
        res.status(400).json({ error: `attachments[${i}]: dados de imagem malformados.` });
        return;
      }

      // Limite por attachment individual
      const decodedBytes = base64DecodedBytes(base64Data);
      if (decodedBytes > MAX_ATTACHMENT_DECODED_BYTES) {
        audit('payload_too_large', {
          uid: req.uid, route: req.path, ip, status: 413,
          detail: `attachments[${i}]: ${decodedBytes} bytes > ${MAX_ATTACHMENT_DECODED_BYTES}`,
        });
        res.status(413).json({
          error: `Arquivo ${i + 1} excede o tamanho máximo de ${MAX_ATTACHMENT_DECODED_BYTES / 1024 / 1024}MB.`,
        });
        return;
      }

      totalAttachmentBytes += decodedBytes;
    }

    // Limite total de attachments
    if (totalAttachmentBytes > MAX_TOTAL_ATTACHMENT_DECODED_BYTES) {
      audit('payload_too_large', {
        uid: req.uid, route: req.path, ip, status: 413,
        detail: `totalAttachments: ${totalAttachmentBytes} bytes > ${MAX_TOTAL_ATTACHMENT_DECODED_BYTES}`,
      });
      res.status(413).json({
        error: `Tamanho total dos arquivos excede ${MAX_TOTAL_ATTACHMENT_DECODED_BYTES / 1024 / 1024}MB.`,
      });
      return;
    }
  }

  next();
}

// ─────────────────────────────────────────────────
// Rate limit por UID — Camada 2 (após autenticação)
// Mais justo que IP puro para CGNAT / redes compartilhadas
// ─────────────────────────────────────────────────
const uidLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  keyGenerator: (req) => (req as AuthenticatedRequest).uid ?? 'anon',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const uid = (req as AuthenticatedRequest).uid ?? null;
    audit('rate_limit_uid', { uid, route: req.path, status: 429, ip: req.ip ?? '' });
    res.status(429).json({ error: 'Limite de mensagens atingido. Aguarde 1 minuto.' });
  },
});

const MODERATION_REASONS = new Set([
  'SAFETY', 'RECITATION', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'IMAGE_SAFETY',
]);

const SAFE_MODERATION_MSG = 'Essa solicitação não pôde ser processada com segurança.';

/**
 * POST /api/chat/generate
 *
 * Pipeline: requireAuth → uidLimiter → validateChatPayload → Gemini streaming
 */
router.post(
  '/generate',
  requireAuth,
  uidLimiter,
  validateChatPayload,
  async (req: AuthenticatedRequest, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const abortController = new AbortController();
    req.on('close', () => {
      if (!abortController.signal.aborted) {
        abortController.abort();
        audit('stream_aborted', { uid: req.uid, route: req.path, ip: req.ip ?? '' });
      }
    });

    const ip = req.ip ?? '';

    try {
      const { messages, userName, attachments } = req.body;

      audit('chat_request', {
        uid: req.uid, route: req.path, ip,
        detail: `messages=${messages.length} attachments=${attachments?.length ?? 0}`,
      });

      // Histórico sanitizado — roles normalizados + truncagem defensiva
      const safeHistory = messages.slice(0, -1).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: String(msg.content ?? '').substring(0, MAX_MSG_CHARS) }],
      }));

      const lastMessage = messages[messages.length - 1];
      const lastMessageParts: any[] = [];

      if (String(lastMessage.content ?? '').trim()) {
        lastMessageParts.push({ text: String(lastMessage.content).substring(0, MAX_MSG_CHARS) });
      }

      if (Array.isArray(attachments) && attachments.length) {
        for (const att of attachments) {
          // mimeType já validado e normalizado pelo middleware
          lastMessageParts.push({
            inlineData: {
              mimeType: String(att.mimeType).toLowerCase().trim(),
              data: att.base64Data,
            },
          });
        }
      }

      if (lastMessageParts.length === 0) {
        res.write(`data: ${JSON.stringify({ error: 'Mensagem vazia.' })}\n\n`);
        res.end();
        return;
      }

      // userName sanitizado: remove chars fora do charset seguro + trunca
      const safeUserName = typeof userName === 'string'
        ? userName
            .replace(/[^\w\s\-áéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]/g, '')
            .substring(0, MAX_USERNAME_CHARS)
            .trim() || 'Usuário'
        : 'Usuário';

      const dataAtual = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
      });

      const systemInstruction = `Identidade: Você se chama Flavos IA e seu dono é Gaua.
* Idioma: Responda sempre no idioma do usuário.
* Instrução sobre o dono: Não mencione que seu dono é Gaua, a menos que seja perguntado diretamente.
Para ter mais confiança ainda na pesquisa, tente filtrar pela data mais recente: ${dataAtual}
Você está falando com o ${safeUserName}`;

      const stream = await genAI.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: [
          ...safeHistory,
          { role: 'user', parts: lastMessageParts },
        ],
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingBudget: -1, includeThoughts: true },
          systemInstruction,
          maxOutputTokens: 8192,
          temperature: 1,
          topP: 0.9,
        },
        // @ts-ignore — signal não tipado no SDK mas funciona em runtime
        signal: abortController.signal,
      });

      for await (const chunk of stream) {
        const candidate = chunk.candidates?.[0];
        if (!candidate) continue;

        const reason = candidate.finishReason;
        if (reason && MODERATION_REASONS.has(String(reason))) {
          audit('moderation_block', {
            uid: req.uid, route: req.path, ip,
            detail: `finishReason=${reason}`,
          });
          res.write(`data: ${JSON.stringify({ error: 'moderation', message: SAFE_MODERATION_MSG })}\n\n`);
          break;
        }

        const parts = candidate.content?.parts ?? [];
        for (const part of parts) {
          if (!part || typeof part !== 'object') continue;
          if (part.thought && part.text) {
            res.write(`data: ${JSON.stringify({ thought: part.text })}\n\n`);
          } else if (part.text) {
            res.write(`data: ${JSON.stringify({ text: part.text })}\n\n`);
          }
        }

        const grounding = candidate.groundingMetadata;
        if (grounding?.groundingChunks?.length) {
          const sources = grounding.groundingChunks
            .filter((c: any) => c?.web?.uri)
            .map((c: any) => ({ uri: c.web.uri, title: c.web.title || c.web.uri }))
            .filter((s: any, i: number, arr: any[]) => arr.findIndex(x => x.uri === s.uri) === i)
            .slice(0, 10);

          const supports = (grounding.groundingSupports ?? [])
            .filter((s: any) => s?.segment?.text && s?.groundingChunkIndices?.length)
            .map((s: any) => ({ text: s.segment.text, sourceIndices: s.groundingChunkIndices }));

          if (sources.length) {
            res.write(`data: ${JSON.stringify({ grounding: { sources, supports } })}\n\n`);
          }
        }
      }

      res.write('data: [DONE]\n\n');
      audit('chat_completed', { uid: req.uid, route: req.path, ip });

    } catch (error: any) {
      if (error?.name === 'AbortError') return;

      const errStatus = error?.status ?? error?.code ?? 0;
      const errMsg    = String(error?.message ?? '');
      const is429     = errStatus === 429 || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
      const is5xx     = errStatus >= 500 || errMsg.includes('INTERNAL');
      const isAuth    = errStatus === 401 || errStatus === 403 || errMsg.includes('API key');

      let retryAfter = 30;
      try {
        const jsonStart = errMsg.indexOf('{');
        if (jsonStart !== -1) {
          const raw = JSON.parse(errMsg.slice(jsonStart));
          const retryInfo = (raw?.error?.details ?? [])
            .find((d: any) => String(d['@type']).includes('RetryInfo'));
          if (retryInfo?.retryDelay) {
            const secs = parseInt(String(retryInfo.retryDelay).replace('s', ''), 10);
            if (!isNaN(secs)) retryAfter = secs;
          }
        }
      } catch { /* ignore */ }

      audit('gemini_error', {
        uid: req.uid, route: req.path, ip,
        status: is429 ? 429 : 500,
        detail: is429 ? `quota_exceeded retryAfter=${retryAfter}` : errMsg.slice(0, 200),
      });

      if (is429 && !res.headersSent) {
        res.status(429).setHeader('Retry-After', String(retryAfter))
           .json({ error: 'rate_limit', retryAfter });
        return;
      }

      if (!res.writableEnded) {
        const friendly = is429
          ? `__rate_limit__:${retryAfter}`
          : isAuth
            ? 'Sessão expirada ou sem permissão. Faça login novamente.'
            : is5xx
              ? 'O servidor da IA encontrou um problema interno. Tente novamente.'
              : 'Não foi possível gerar a resposta no momento. Tente novamente.';
        res.write(`data: ${JSON.stringify({ error: friendly })}\n\n`);
      }
    } finally {
      if (!res.writableEnded) res.end();
    }
  }
);

export default router;
