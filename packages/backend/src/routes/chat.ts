// ===================================================
// Flavos IA 3.0 — Chat Route (Gemini 3.1-flash Proxy)
// ===================================================

import { Router, type Request, type Response } from 'express';
import { genAI, GEMINI_MODEL } from '../config/gemini.js';

const router = Router();

/**
 * Interface do payload recebido do frontend.
 */
interface ChatRequestBody {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

/**
 * POST /api/chat/generate
 *
 * Recebe o histórico de mensagens do frontend e gera uma resposta
 * usando o modelo Gemini 3.1-flash via @google/genai.
 *
 * O frontend NUNCA tem acesso à API key — este endpoint é o proxy seguro.
 *
 * TODO: Firebase — Adicionar middleware de autenticação para validar Firebase ID token.
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as ChatRequestBody;

    // Validação do payload
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        error: 'O campo "messages" é obrigatório e deve conter pelo menos uma mensagem.',
      });
      return;
    }

    // Validação de cada mensagem
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        res.status(400).json({
          error: 'Cada mensagem deve ter os campos "role" e "content".',
        });
        return;
      }
    }

    console.log(`📨 Recebendo ${messages.length} mensagem(ns) → Gemini ${GEMINI_MODEL}`);

    // Mapeia o histórico para o formato do Gemini
    // O @google/genai usa 'user' e 'model' como roles
    const geminiHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: msg.content }],
    }));

    // Última mensagem do usuário como o prompt atual
    const lastMessage = messages[messages.length - 1];

    // Chama o Gemini 3.1-flash via @google/genai
    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        ...geminiHistory,
        {
          role: 'user',
          parts: [{ text: lastMessage.content }],
        },
      ],
      config: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      },
    });

    // Extrai o texto da resposta
    const responseText =
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Desculpe, não consegui gerar uma resposta.';

    console.log(`✅ Resposta gerada com sucesso (${responseText.length} chars)`);

    res.json({
      content: responseText,
      model: GEMINI_MODEL,
    });
  } catch (error: any) {
    console.error('❌ Erro ao gerar resposta:', error?.message || error);

    // Erro específico de API key inválida
    if (error?.status === 401 || error?.message?.includes('API key')) {
      res.status(401).json({
        error: 'API key do Gemini inválida ou não configurada.',
      });
      return;
    }

    // Erro de rate limit
    if (error?.status === 429) {
      res.status(429).json({
        error: 'Limite de requisições excedido. Tente novamente em alguns segundos.',
      });
      return;
    }

    res.status(500).json({
      error: 'Erro interno ao processar a requisição.',
    });
  }
});

export default router;
