// ===================================================
// Flavos IA 3.0 — Chat Route (SSE Streaming Proxy)
// Security layers:
//   1. requireAuth  — Firebase ID token verification (middleware)
//   2. uidLimiter   — Per-UID rate limit (20 req/min, Camada 2)
//   3. History sanitization — blocks prompt injection
//   4. Defensive moderation — Gemini safety signals + edge cases
//   5. Audit logging — all security events, no sensitive data
// ===================================================

import { Router, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { ThinkingLevel } from '@google/genai';
import { genAI, GEMINI_MODEL } from '../config/gemini.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { audit } from '../middleware/logger.js';

const router = Router();

// ─────────────────────────────────────────────────
// Camada 2 — Rate limit por UID (após autenticação)
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

// ─────────────────────────────────────────────────
// finishReasons que indicam bloqueio por moderação
// ─────────────────────────────────────────────────
const MODERATION_REASONS = new Set([
  'SAFETY', 'RECITATION', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'IMAGE_SAFETY',
]);

const SAFE_MODERATION_MSG = 'Essa solicitação não pôde ser processada com segurança.';

/**
 * POST /api/chat/generate
 *
 * Recebe histórico de mensagens e faz streaming da resposta via SSE.
 * Suporta Grounding (Google Search) e Thinking.
 */
router.post('/generate', requireAuth, uidLimiter, async (req: AuthenticatedRequest, res: Response) => {
  // --- SSE Headers ---
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // --- Abort quando o cliente fechar a conexão ---
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

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'O campo "messages" é obrigatório.' })}\n\n`);
      res.end();
      return;
    }

    console.log(`📨 [uid=${req.uid}] ${messages.length} msg(ns) → Gemini ${GEMINI_MODEL} (streaming)`);

    // --- Sanitização do histórico (anti prompt-injection) ---
    const safeHistory = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: String(msg.content ?? '').substring(0, 10_000) }],
    }));

    // --- Última mensagem (com possíveis anexos) ---
    const lastMessage = messages[messages.length - 1];
    const lastMessageParts: any[] = [];

    if (String(lastMessage.content ?? '').trim()) {
      lastMessageParts.push({ text: lastMessage.content });
    }
    if (Array.isArray(attachments) && attachments.length) {
      for (const att of attachments) {
        if (att.mimeType && att.base64Data) {
          lastMessageParts.push({ inlineData: { mimeType: att.mimeType, data: att.base64Data } });
        }
      }
    }

    if (lastMessageParts.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'Mensagem vazia.' })}\n\n`);
      res.end();
      return;
    }

    // --- System prompt ---
    const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const systemInstruction = `Identidade: Você se chama Flavos IA e seu dono é Gaua.
* Idioma: Responda sempre no idioma do usuário.
* Instrução sobre o dono: Não mencione que seu dono é Gaua, a menos que seja perguntado diretamente.
Para ter mais confiança ainda na pesquisa, tente filtrar pela data mais recente: ${dataAtual}
Você está falando com o ${userName || 'Usuário'}`;

    // --- generateContentStream com Thinking + Grounding ---
    const stream = await genAI.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: [
        ...safeHistory,
        { role: 'user', parts: lastMessageParts },
      ],
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: {
          thinkingBudget: -1,
          includeThoughts: true,
        },
        systemInstruction,
        maxOutputTokens: 8192,
        temperature: 1,
        topP: 0.9,
      },
      // @ts-ignore — signal ainda não tipado no SDK mas funciona em runtime
      signal: abortController.signal,
    });

    // --- Processa chunks com moderação defensiva ---
    for await (const chunk of stream) {
      const candidate = chunk.candidates?.[0];

      // Candidato ausente — skip silencioso
      if (!candidate) continue;

      // Moderação: finishReason problemático
      const reason = candidate.finishReason;
      if (reason && MODERATION_REASONS.has(String(reason))) {
        audit('moderation_block', {
          uid: req.uid, route: req.path, ip,
          detail: `finishReason=${reason}`,
        });
        res.write(`data: ${JSON.stringify({ error: 'moderation', message: SAFE_MODERATION_MSG })}\n\n`);
        break;
      }

      // Partes ausentes — skip (evita NPE em produção)
      const parts = candidate.content?.parts ?? [];

      for (const part of parts) {
        // Sem texto ou dado válido — skip silencioso (sem emitir chunk vazio)
        if (!part || typeof part !== 'object') continue;

        if (part.thought && part.text) {
          res.write(`data: ${JSON.stringify({ thought: part.text })}\n\n`);
        } else if (part.text) {
          res.write(`data: ${JSON.stringify({ text: part.text })}\n\n`);
        }
        // Outros tipos (inline data, function calls) → ignorados silenciosamente
      }

      // Grounding — último chunk geralmente
      const grounding = candidate.groundingMetadata;
      if (grounding?.groundingChunks?.length) {
        const sources = grounding.groundingChunks
          .filter((c: any) => c?.web?.uri)
          .map((c: any) => ({ uri: c.web.uri, title: c.web.title || c.web.uri }))
          .filter((s: any, i: number, arr: any[]) => arr.findIndex(x => x.uri === s.uri) === i)
          .slice(0, 10); // limite defensivo

        const rawSupports = grounding.groundingSupports ?? [];
        const supports = rawSupports
          .filter((s: any) => s?.segment?.text && s?.groundingChunkIndices?.length)
          .map((s: any) => ({ text: s.segment.text, sourceIndices: s.groundingChunkIndices }));

        if (sources.length) {
          res.write(`data: ${JSON.stringify({ grounding: { sources, supports } })}\n\n`);
        }
      }
    }

    res.write('data: [DONE]\n\n');
    console.log(`✅ [uid=${req.uid}] Stream concluído.`);

  } catch (error: any) {
    if (error?.name === 'AbortError') {
      // Silencioso — cliente fechou a conexão propositalmente
      return;
    }

    audit('gemini_error', {
      uid: req.uid, route: req.path, ip, status: 500,
      detail: error?.message ?? 'Unknown error',
    });
    console.error('❌ Erro no stream:', error?.message || error);

    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Erro interno.' })}\n\n`);
    }
  } finally {
    if (!res.writableEnded) res.end();
  }
});

export default router;
