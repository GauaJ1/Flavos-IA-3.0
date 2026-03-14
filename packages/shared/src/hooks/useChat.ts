// ===================================================
// Flavos IA 3.0 — useChat Hook (Realtime + Firestore)
// ===================================================

import { create } from 'zustand';
import type { ChatState, Message, ConversationMeta } from '../types';
import { aiService } from '../services/aiService';
import { createConversation, saveEntryAndUpdateMeta, listenConversations, listenEntries } from '../services/dbService';
import { generateId } from '../utils/generateId';
import { useAuth } from './useAuth';
import type { Unsubscribe } from 'firebase/firestore';

// Guarda as funções de unsubscribe dos listeners realtime fora do store
// para não causar re-renders no Zustand
let _unsubConversations: Unsubscribe | null = null;
let _unsubEntries: Unsubscribe | null = null;

/** Cria um listener que preserva sources/supports do estado atual ao receber snapshot do Firestore.
 *  Essas propriedades vêm apenas do backend Gemini e não são salvas no Firestore. */
function makeGroundingAwareListener(
  set: (fn: (state: any) => any) => void
) {
  return (newMessages: Message[]) => {
    set((state: any) => {
      const sourceMap = new Map<string, Pick<Message, 'sources' | 'supports'>>(
        state.messages
          .filter((m: Message) => m.sources?.length || m.supports?.length)
          .map((m: Message) => [m.content.slice(0, 120), { sources: m.sources, supports: m.supports }])
      );
      const merged = newMessages.map((m: Message) => ({
        ...m,
        ...(sourceMap.get(m.content.slice(0, 120)) ?? {}),
      }));
      return { messages: merged, isLoading: false };
    });
  };
}

interface ExtendedChatState extends ChatState {
  currentConversationId: string | null;
  conversations: ConversationMeta[];
  loadConversations: () => void;
  loadConversation: (id: string) => Promise<void>;
  unsubscribeAll: () => void;
}

export const useChat = create<ExtendedChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  currentConversationId: null,
  conversations: [],

  /**
   * Inicia o listener realtime da lista de conversas (sidebar).
   * Carrega APENAS metadados — nunca entries.
   * Substitui qualquer listener anterior de conversas.
   */
  loadConversations: () => {
    const user = useAuth.getState().user;
    if (!user) return;

    // Cancela listener anterior se existir
    if (_unsubConversations) {
      _unsubConversations();
      _unsubConversations = null;
    }

    _unsubConversations = listenConversations(user.id, (conversations) => {
      set({ conversations });
    });
  },

  /**
   * Inicia o listener realtime das entries de uma conversa específica.
   * Para o listener de entries anterior antes de iniciar o novo.
   */
  loadConversation: async (conversationId: string) => {
    set({ isLoading: true, error: null, currentConversationId: conversationId, messages: [] });

    // Cancela listener de entries anterior
    if (_unsubEntries) {
      _unsubEntries();
      _unsubEntries = null;
    }

    // Helper: merge sources/supports from existing state when listener fires
    _unsubEntries = listenEntries(conversationId, makeGroundingAwareListener(set));
  },

  /**
   * Envia uma mensagem, cria a conversa se necessário (atômico), e salva tudo no Firestore.
   */
  sendMessage: async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const user = useAuth.getState().user;
    let conversationId = get().currentConversationId;

    // Otimismo local: adiciona a mensagem do usuário instantaneamente na UI
    const optimisticMsg: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, optimisticMsg],
      isLoading: true,
      error: null,
    }));

    try {
      if (user) {
        if (!conversationId) {
          // PRIMEIRA MENSAGEM — ordem importa para evitar race condition:
          // 1. Cria o documento da conversa
          conversationId = await createConversation(user.id, trimmed);
          set({ currentConversationId: conversationId });

          // 2. Salva a entry NO FIRESTORE ANTES de assinar o listener.
          //    Se o listener fosse assinado antes, dispararia com snapshot []
          //    e sobrescreveria a mensagem otimista.
          await saveEntryAndUpdateMeta(conversationId, {
            role: 'user',
            sender: 'user',
            body: trimmed,
          });

          // 3. Só agora assina o listener — primeiro snapshot já tem a entry.
          if (_unsubEntries) _unsubEntries();
          _unsubEntries = listenEntries(conversationId, makeGroundingAwareListener(set));
        } else {
          // Mensagem subsequente: salva entry + atualiza metadata atomicamente
          await saveEntryAndUpdateMeta(conversationId, {
            role: 'user',
            sender: 'user',
            body: trimmed,
          });
        }
      }

      // Chama o backend Gemini com o histórico atual
      const history = get().messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await aiService.generateResponse(history);

      // Salva resposta da IA + atualiza metadados — batch atômico
      if (user && conversationId) {
        await saveEntryAndUpdateMeta(conversationId, {
          role: 'assistant',
          sender: 'ai',
          body: response.content,
        });
        // Injeta fontes + suportes na última mensagem da IA
        if (response.sources?.length || response.supports?.length) {
          set((state) => ({
            messages: state.messages.map((m, i) =>
              i === state.messages.length - 1 && m.role === 'assistant'
                ? { ...m, sources: response.sources, supports: response.supports }
                : m
            ),
          }));
        }
      } else {
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: generateId(),
              role: 'assistant' as const,
              content: response.content,
              timestamp: Date.now(),
              sources: response.sources,
              supports: response.supports,
            },
          ],
        }));
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao contactar a IA.',
      });
    }
  },

  /**
   * Limpa a conversa ativa (sem apagar do Firestore).
   * Para o listener de entries, mas mantém o de conversas (sidebar).
   */
  clearMessages: () => {
    if (_unsubEntries) {
      _unsubEntries();
      _unsubEntries = null;
    }
    set({ messages: [], error: null, currentConversationId: null });
  },

  clearError: () => set({ error: null }),

  /**
   * Para TODOS os listeners. Chamar no logout.
   */
  unsubscribeAll: () => {
    if (_unsubConversations) { _unsubConversations(); _unsubConversations = null; }
    if (_unsubEntries) { _unsubEntries(); _unsubEntries = null; }
    set({ messages: [], conversations: [], currentConversationId: null });
  },
}));
