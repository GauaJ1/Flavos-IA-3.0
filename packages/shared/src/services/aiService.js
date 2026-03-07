// ===================================================
// Flavos IA 3.0 — AI Service (Frontend → Backend Proxy)
// ===================================================
import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
/**
 * Serviço de IA que se comunica com o backend proxy.
 * O backend é responsável por chamar o @google/genai com a API key segura.
 * O frontend NUNCA tem acesso direto à chave da API.
 */
class AIService {
    baseUrl;
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }
    /**
     * Envia mensagens para o backend proxy e recebe resposta do Gemini 3.1-flash.
     *
     * @param messages - Histórico de mensagens da conversa
     * @returns Resposta gerada pelo modelo
     * @throws Error se a requisição falhar
     */
    async generateResponse(messages) {
        const payload = { messages };
        const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CHAT_GENERATE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // TODO: Firebase — Adicionar Authorization header com token do Firebase
                // 'Authorization': `Bearer ${firebaseToken}`,
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'Unknown error');
            throw new Error(`Erro ao gerar resposta: ${response.status} — ${errorBody}`);
        }
        const data = await response.json();
        return data;
    }
    /**
     * Atualiza a URL base (útil para testes ou troca de ambiente).
     */
    setBaseUrl(url) {
        this.baseUrl = url;
    }
}
// Exporta instância singleton
export const aiService = new AIService();
export { AIService };
//# sourceMappingURL=aiService.js.map