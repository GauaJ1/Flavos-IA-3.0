// ===================================================
// Flavos IA 3.0 — useChat Hook (Realtime + Firestore)
// ===================================================

import { create } from 'zustand';
import type { ChatState, Message, ConversationMeta, MediaAttachment } from '../types';
import { aiService } from '../services/aiService';
import { createConversation, saveEntryAndUpdateMeta, listenConversations, listenEntries } from '../services/dbService';
import { generateId } from '../utils/generateId';
import { useAuth } from './useAuth';
import type { Unsubscribe } from 'firebase/firestore';

// Guarda as funções de unsubscribe dos listeners realtime fora do store
// para não causar re-renders no Zustand
let _unsubConversations: Unsubscribe | null = null;
let _unsubEntries: Unsubscribe | null = null;

/** Cria um listener que preserva sources/supports/thoughts/attachments do estado atual ao receber snapshot do Firestore.
 *  Essas propriedades vêm apenas do cliente e não são salvas no Firestore. */
function makeGroundingAwareListener(
  set: (fn: (state: any) => any) => void
) {
  return (newMessages: Message[]) => {
    set((state: any) => {
      const runtimeMap = new Map<string, Pick<Message, 'sources' | 'supports' | 'thoughts' | 'attachments'>>(
        state.messages
          .filter((m: Message) => m.sources?.length || m.supports?.length || m.thoughts || m.attachments?.length)
          .map((m: Message) => [m.content.slice(0, 120), {
            sources: m.sources,
            supports: m.supports,
            thoughts: m.thoughts,
            attachments: m.attachments,
          }])
      );
      const merged = newMessages.map((m: Message) => ({
        ...m,
        ...(runtimeMap.get(m.content.slice(0, 120)) ?? {}),
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
  isTyping: false,
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
  sendMessage: async (content: string, attachments?: MediaAttachment[]) => {
    const trimmed = content.trim();
    if (!trimmed && !attachments?.length) return;

    const user = useAuth.getState().user;
    let conversationId = get().currentConversationId;

    // Otimismo local: adiciona a mensagem do usuário instantaneamente na UI
    const optimisticMsg: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      ...(attachments?.length && { attachments }),
    };

    set((state) => ({
      messages: [...state.messages, optimisticMsg],
      isTyping: true,
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
            // Salva apenas metadados leves — NUNCA o base64
            ...(attachments?.length && {
              attachmentsMeta: attachments.map(a => ({ name: a.name, mimeType: a.mimeType })),
            }),
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
            ...(attachments?.length && {
              attachmentsMeta: attachments.map(a => ({ name: a.name, mimeType: a.mimeType })),
            }),
          });
        }
      }

      // Chama o backend Gemini com o histórico atual e o nome do usuário
      const history = get().messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await aiService.generateResponse(
        history, 
        user?.displayName || 'Usuário',
        attachments,
      );

      // Salva resposta da IA + atualiza metadados — batch atômico
      if (user && conversationId) {
        await saveEntryAndUpdateMeta(conversationId, {
          role: 'assistant',
          sender: 'ai',
          body: response.content,
        });
        // Injeta fontes, suportes e pensamentos na última mensagem da IA
        if (response.sources?.length || response.supports?.length || response.thoughts) {
          set((state) => ({
            messages: state.messages.map((m, i) =>
              i === state.messages.length - 1 && m.role === 'assistant'
                ? { ...m, sources: response.sources, supports: response.supports, thoughts: response.thoughts }
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
              thoughts: response.thoughts,
            },
          ],
        }));
      }

      set({ isTyping: false });
    } catch (error) {
      set({
        isTyping: false,
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
