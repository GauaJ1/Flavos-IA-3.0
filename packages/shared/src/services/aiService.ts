// ===================================================
// Flavos IA 3.0 — AI Service (Frontend → Backend Proxy)
// ===================================================

import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import type { ChatRequest, ChatResponse, Message } from '../types';

/**
 * Serviço de IA que se comunica com o backend proxy.
 * O backend é responsável por chamar o @google/genai com a API key segura.
 * O frontend NUNCA tem acesso direto à chave da API.
 */
class AIService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Envia mensagens para o backend proxy e recebe resposta do Gemini 3.1-flash.
   *
   * @param messages - Histórico de mensagens da conversa
   * @returns Resposta gerada pelo modelo
   * @throws Error se a requisição falhar
   */
  async generateResponse(
    messages: Pick<Message, 'role' | 'content'>[],
    userName?: string
  ): Promise<ChatResponse> {
    const payload: ChatRequest = { messages, userName };
    const url = `${this.baseUrl}${API_ENDPOINTS.CHAT_GENERATE}`;
    console.log(`[AIService] Sending request to: ${url}`);

    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Firebase — Adicionar Authorization header com token do Firebase
          // 'Authorization': `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Erro ao gerar resposta: ${response.status} — ${errorBody}`
      );
    }

    const data: ChatResponse = await response.json();
    return data;
  }

  /**
   * Atualiza a URL base (útil para testes ou troca de ambiente).
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
}

// Exporta instância singleton
export const aiService = new AIService();
export { AIService };
