// ===================================================
// Flavos IA 3.0 — Chat Route (Gemini 3.1-flash Proxy)
// ===================================================

import { Router, type Request, type Response } from 'express';
import { genAI, GEMINI_MODEL } from '../config/gemini.js';
import { ThinkingLevel } from '@google/genai';
import type { ChatResponse } from '@flavos/shared/src/types';

const router = Router();

/**
 * Interface do payload recebido do frontend.
 */
interface ChatRequestBody {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  userName?: string;
  attachments?: Array<{
    name: string;
    mimeType: string;
    base64Data: string;
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
    const { messages, userName, attachments } = req.body as ChatRequestBody;

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

    const dataAtual = `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getFullYear()).slice(-2)}`;

    const systemInstruction = `Identidade: Você se chama Flavos IA e seu dono é Gaua.
* Idioma: Responda sempre no idioma do usuário.
* Instrução sobre o dono: Não mencione que seu dono é Gaua, a menos que seja perguntado diretamente ou a informação seja estritamente relevante para a resposta.
Para ter mais confiança ainda na pesquisa, tente filtrar pela data mais recente: ${dataAtual}
Você está falando com o ${userName || 'Usuário'}`;

    // Monta as parts da última mensagem: texto + mídias (se houver)
    const lastMessageParts: any[] = [];
    if (lastMessage.content.trim()) {
      lastMessageParts.push({ text: lastMessage.content });
    }
    if (attachments?.length) {
      for (const att of attachments) {
        lastMessageParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.base64Data,
          },
        });
      }
      console.log(`📎 ${attachments.length} arquivo(s) recebido(s): ${attachments.map(a => a.name).join(', ')}`);
    }

    // Chama o Gemini com Google Search Grounding habilitado
    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        ...geminiHistory,
        {
          role: 'user',
          parts: lastMessageParts,
        },
      ],
      config: {
        // TODO: Liberar quando o gemini-3.1-flash sair da preview
        tools: [{ googleSearch: {} }],  // Google Search Grounding
        thinkingConfig: {
          thinkingBudget: -1, // Gemini 2.5
          //thinkingLevel: ThinkingLevel.LOW, -- Gemini 3 pra cima
          includeThoughts: true,
        },
        systemInstruction,
        // Re-abilitando limites normais enquanto não usa grounding
        maxOutputTokens: 8192,
        temperature: 1,
        topP: 0.9,
        topK: 40,
      },
    });

    // Extrai o texto da resposta e os pensamentos (se existirem)
    let responseText = '';
    let thoughtsText = '';

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.thought) {
        thoughtsText += part.text;
      } else if (part.text) {
        responseText += part.text;
      }
    }

    if (!responseText) {
      responseText = 'Desculpe, não consegui gerar uma resposta.';
    }

    // Extrai as fontes do grounding (se disponíveis)
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

    const sources = groundingChunks
      .filter((chunk: any) => chunk?.web?.uri)
      .map((chunk: any) => ({
        uri: chunk.web.uri as string,
        title: chunk.web.title as string || chunk.web.uri as string,
      }))
      // Remove duplicatas por URI
      .filter(
        (src: any, idx: number, arr: any[]) =>
          arr.findIndex((s: any) => s.uri === src.uri) === idx
      );

    // Extrai os suportes de grounding (segmentos de texto → fontes)
    const rawSupports =
      response.candidates?.[0]?.groundingMetadata?.groundingSupports ?? [];

    const supports = rawSupports
      .filter((s: any) => s?.segment?.text && s?.groundingChunkIndices?.length)
      .map((s: any) => ({
        text: s.segment.text as string,
        sourceIndices: s.groundingChunkIndices as number[],
      }));

    console.log(`✅ Resposta gerada (${responseText.length} chars, ${sources.length} fontes, ${supports.length} suportes)`);

    const responsePayload: ChatResponse = {
      content: responseText,
      model: GEMINI_MODEL,
      ...(sources.length > 0 && { sources }),
      ...(supports.length > 0 && { supports }),
      ...(thoughtsText && { thoughts: thoughtsText }),
    };

    res.json(responsePayload);
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
