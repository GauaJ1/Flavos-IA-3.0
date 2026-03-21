// ===================================================
// Flavos IA 3.0 — useChat Hook (Realtime + Firestore)
// ===================================================

import { create } from 'zustand';
import type { ChatState, Message, ConversationMeta, MediaAttachment } from '../types';
import { aiService } from '../services/aiService';
import { createConversation, saveEntryAndUpdateMeta, listenConversations, listenEntries, pinConversation as dbPinConversation } from '../services/dbService';
import { generateId } from '../utils/generateId';
import { useAuth } from './useAuth';
import type { Unsubscribe } from 'firebase/firestore';

// Guarda as funções de unsubscribe dos listeners realtime fora do store
// para não causar re-renders no Zustand
let _unsubConversations: Unsubscribe | null = null;
let _unsubEntries: Unsubscribe | null = null;
let _activeStreamController: AbortController | null = null;

/** Cria um listener que preserva sources/supports/thoughts/attachments do estado atual ao receber snapshot do Firestore.
 *  Também re-insere mensagens em streaming (isStreaming: true) que ainda não foram salvas no Firestore. */
function makeGroundingAwareListener(
  set: (fn: (state: any) => any) => void
) {
  return (newMessages: Message[]) => {
    set((state: any) => {
      // Preserva dados runtime que não são salvos no Firestore
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

      // CRITICAL: Re-append any streaming message that isn't in Firestore yet.
      // Without this, the listener fires when the user message is persisted and
      // removes the AI streaming placeholder from state mid-stream.
      const streamingMsg = state.messages.find((m: Message) => m.isStreaming);
      if (streamingMsg) {
        return { messages: [...merged, streamingMsg], isLoading: false };
      }

      return { messages: merged, isLoading: false };
    });
  };
}

interface ExtendedChatState extends ChatState {
  currentConversationId: string | null;
  conversations: ConversationMeta[];
  loadConversations: () => void;
  loadConversation: (id: string) => Promise<void>;
  stopGeneration: () => void;
  pinConversation: (id: string, pinned: boolean) => Promise<void>;
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
      // Sort: pinned first, then by updatedAt desc
      const sorted = [...conversations].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      });
      set({ conversations: sorted });
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
   * Para a geração de resposta da IA imediatamente.
   * Remove o placeholder de streaming e restaura o estado.
   */
  stopGeneration: () => {
    if (_activeStreamController) {
      _activeStreamController.abort();
      _activeStreamController = null;
    }
    // Remove streaming placeholder and reset state
    set((state) => ({
      messages: state.messages.filter((m) => !m.isStreaming || m.content.trim()),
      isTyping: false,
    }));
  },

  /**
   * Fixa ou desfixa uma conversa na sidebar.
   * Atualiza o Firestore e o estado local (ordenação: fixadas no topo).
   */
  pinConversation: async (id: string, pinned: boolean) => {
    await dbPinConversation(id, pinned);
    set((state) => {
      const updated = state.conversations.map((c) =>
        c.id === id ? { ...c, pinned } : c
      );
      const sorted = [...updated].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      });
      return { conversations: sorted };
    });
  },

  /**
   * Envia uma mensagem e transmite a resposta da IA em tempo real via SSE.
   * Atualiza o estado incrementalmente a cada chunk de texto/thinking/grounding.
   * Salva no Firestore apenas quando o stream estiver concluído (onDone).
   */
  sendMessage: async (content: string, attachments?: MediaAttachment[]) => {
    const trimmed = content.trim();
    if (!trimmed && !attachments?.length) return;

    // Cancela stream anterior se existir
    if (_activeStreamController) {
      _activeStreamController.abort();
      _activeStreamController = null;
    }

    const user = useAuth.getState().user;
    let conversationId = get().currentConversationId;

    // Mensagem do usuário — adicionada otimisticamente
    const optimisticMsg: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      ...(attachments?.length && { attachments }),
    };

    // Placeholder da IA com isStreaming: true
    const aiPlaceholder: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    set((state) => ({
      messages: [...state.messages, optimisticMsg, aiPlaceholder],
      isTyping: true,
      error: null,
    }));

    try {
      // Persiste a mensagem do usuário no Firestore (se logado)
      if (user) {
        if (!conversationId) {
          conversationId = await createConversation(user.id, trimmed);
          set({ currentConversationId: conversationId });
          await saveEntryAndUpdateMeta(conversationId, {
            role: 'user', sender: 'user', body: trimmed,
            ...(attachments?.length && { attachmentsMeta: attachments.map(a => ({ name: a.name, mimeType: a.mimeType })) }),
          });
          if (_unsubEntries) _unsubEntries();
          _unsubEntries = listenEntries(conversationId, makeGroundingAwareListener(set));
        } else {
          await saveEntryAndUpdateMeta(conversationId, {
            role: 'user', sender: 'user', body: trimmed,
            ...(attachments?.length && { attachmentsMeta: attachments.map(a => ({ name: a.name, mimeType: a.mimeType })) }),
          });
        }
      }

      const history = get().messages
        .filter(m => !m.isStreaming)
        .map(m => ({ role: m.role, content: m.content }));

      // Helper: update the last (AI streaming) message in state
      const updateLastAiMsg = (updater: (msg: Message) => Message) => {
        set((state) => {
          const msgs = [...state.messages];
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant') msgs[msgs.length - 1] = updater(last);
          return { messages: msgs };
        });
      };

      // Closure accumulators — reliable even if Firestore listener re-renders the array
      let accContent = '';
      let accThoughts = '';
      let accSources: any[] = [];
      let accSupports: any[] = [];
      let firstChunk = true;

      const controller = aiService.generateResponseStream(
        history,
        user?.displayName || 'Usuário',
        attachments,
        {
          onText: (text) => {
            accContent += text;
            // Hide the "Pensando..." indicator as soon as text starts
            if (firstChunk) { firstChunk = false; set({ isTyping: false }); }
            updateLastAiMsg(m => ({ ...m, content: m.content + text }));
          },
          onThought: (thought) => {
            accThoughts += thought;
            // Hide "Pensando..." as soon as thinking starts (not just on first text chunk)
            if (firstChunk) { firstChunk = false; set({ isTyping: false }); }
            updateLastAiMsg(m => ({ ...m, thoughts: (m.thoughts ?? '') + thought }));
          },
          onGrounding: (sources, supports) => {
            accSources = sources;
            accSupports = supports;
            updateLastAiMsg(m => ({ ...m, sources, supports }));
          },
          onDone: async () => {
            _activeStreamController = null;
            updateLastAiMsg(m => ({ ...m, isStreaming: false }));
            set({ isTyping: false });

            // Persist using closure variable — not affected by Firestore snapshot rewrites
            if (user && conversationId && accContent) {
              await saveEntryAndUpdateMeta(conversationId, {
                role: 'assistant', sender: 'ai', body: accContent,
              });
            }
          },
          onError: (err) => {
            _activeStreamController = null;
            updateLastAiMsg(m => ({ ...m, isStreaming: false, content: m.content || 'Erro ao gerar resposta.' }));
            set({ isTyping: false, error: err.message });
          },
        }
      );

      _activeStreamController = controller;

    } catch (error) {
      set({
        isTyping: false,
        error: error instanceof Error ? error.message : 'Erro ao contactar a IA.',
      });
      // Remove o placeholder se falhou antes do stream iniciar
      set((state) => ({
        messages: state.messages.filter(m => m.id !== aiPlaceholder.id),
      }));
    }
  },

  /**
   * Limpa a conversa ativa (sem apagar do Firestore).
   * Para o listener de entries, mas mantém o de conversas (sidebar).
   */
  clearMessages: () => {
    if (_activeStreamController) { _activeStreamController.abort(); _activeStreamController = null; }
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
    if (_activeStreamController) { _activeStreamController.abort(); _activeStreamController = null; }
    if (_unsubConversations) { _unsubConversations(); _unsubConversations = null; }
    if (_unsubEntries) { _unsubEntries(); _unsubEntries = null; }
    set({ messages: [], conversations: [], currentConversationId: null });
  },
}));
