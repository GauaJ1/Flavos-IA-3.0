// ===================================================
// Flavos IA 3.0 — Tests: useChat Hook
// ===================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChat } from '../hooks/useChat';

// Mock do aiService
vi.mock('../services/aiService', () => ({
  aiService: {
    generateResponse: vi.fn().mockResolvedValue({
      content: 'Resposta da IA mockada',
      model: 'gemini-3.1-flash-lite-preview',
    }),
  },
}));

describe('useChat', () => {
  beforeEach(() => {
    // Reset do store entre testes
    useChat.setState({
      messages: [],
      isLoading: false,
      error: null,
    });
  });

  it('deve começar com estado inicial vazio', () => {
    const state = useChat.getState();
    expect(state.messages).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('deve adicionar mensagem do usuário ao enviar', async () => {
    await useChat.getState().sendMessage('Olá, IA!');

    const state = useChat.getState();
    // Deve ter 2 mensagens: user + ai
    expect(state.messages.length).toBeGreaterThanOrEqual(1);
    expect(state.messages[0].role).toBe('user');
    expect(state.messages[0].content).toBe('Olá, IA!');
  });

  it('deve ignorar mensagens vazias', async () => {
    await useChat.getState().sendMessage('');
    await useChat.getState().sendMessage('   ');

    const state = useChat.getState();
    expect(state.messages).toEqual([]);
  });

  it('deve limpar mensagens', async () => {
    await useChat.getState().sendMessage('Teste');

    useChat.getState().clearMessages();
    const state = useChat.getState();
    expect(state.messages).toEqual([]);
  });

  it('deve limpar erro', () => {
    useChat.setState({ error: 'Erro de teste' });
    useChat.getState().clearError();
    expect(useChat.getState().error).toBeNull();
  });
});
