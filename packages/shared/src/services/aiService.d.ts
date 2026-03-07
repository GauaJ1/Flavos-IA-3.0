import type { ChatResponse, Message } from '../types';
/**
 * Serviço de IA que se comunica com o backend proxy.
 * O backend é responsável por chamar o @google/genai com a API key segura.
 * O frontend NUNCA tem acesso direto à chave da API.
 */
declare class AIService {
    private baseUrl;
    constructor(baseUrl?: string);
    /**
     * Envia mensagens para o backend proxy e recebe resposta do Gemini 3.1-flash.
     *
     * @param messages - Histórico de mensagens da conversa
     * @returns Resposta gerada pelo modelo
     * @throws Error se a requisição falhar
     */
    generateResponse(messages: Pick<Message, 'role' | 'content'>[]): Promise<ChatResponse>;
    /**
     * Atualiza a URL base (útil para testes ou troca de ambiente).
     */
    setBaseUrl(url: string): void;
}
export declare const aiService: AIService;
export { AIService };
//# sourceMappingURL=aiService.d.ts.map