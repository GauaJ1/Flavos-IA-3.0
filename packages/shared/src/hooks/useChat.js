// ===================================================
// Flavos IA 3.0 — useChat Hook (Zustand Store)
// ===================================================
import { create } from 'zustand';
import { aiService } from '../services/aiService';
import { generateId } from '../utils/formatters';
/**
 * Store do chat com Zustand.
 * Gerencia mensagens, estado de loading e comunicação com o backend proxy.
 */
export const useChat = create((set, get) => ({
    messages: [],
    isLoading: false,
    error: null,
    /**
     * Envia uma mensagem do usuário e obtém resposta da IA via backend proxy.
     */
    sendMessage: async (content) => {
        const trimmed = content.trim();
        if (!trimmed)
            return;
        // Adiciona mensagem do usuário
        const userMessage = {
            id: generateId(),
            role: 'user',
            content: trimmed,
            timestamp: Date.now(),
        };
        set((state) => ({
            messages: [...state.messages, userMessage],
            isLoading: true,
            error: null,
        }));
        try {
            // Prepara histórico para enviar ao backend
            const history = get().messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));
            // Chama o backend proxy → Gemini 3.1-flash
            const response = await aiService.generateResponse(history);
            // Adiciona resposta da IA
            const aiMessage = {
                id: generateId(),
                role: 'assistant',
                content: response.content,
                timestamp: Date.now(),
            };
            set((state) => ({
                messages: [...state.messages, aiMessage],
                isLoading: false,
            }));
        }
        catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Erro desconhecido ao contactar a IA.';
            set({ isLoading: false, error: errorMessage });
        }
    },
    /**
     * Limpa todas as mensagens (nova conversa).
     */
    clearMessages: () => set({ messages: [], error: null }),
    /**
     * Limpa o estado de erro.
     */
    clearError: () => set({ error: null }),
}));
//# sourceMappingURL=useChat.js.map