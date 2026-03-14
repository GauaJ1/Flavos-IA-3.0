// ===================================================
// Flavos IA 3.0 — Types (Secure Firestore Schema)
// ===================================================

// ===== Chat / Messaging =====

/** Roles possíveis para uma entrada no chat. */
export type EntryRole = 'user' | 'assistant' | 'system';

/** Senders possíveis — permite suporte futuro a tools/agents. */
export type EntrySender = 'user' | 'ai' | 'tool' | 'agent' | 'system';

/**
 * Representa uma entrada (mensagem) armazenada em:
 * conversations/{conversationId}/entries/{entryId}
 */
export interface Entry {
  id: string;
  role: EntryRole;
  sender: EntrySender;
  body: string;
  createdAt: number; // toMillis() de ServerTimestamp
}

/**
 * Status possíveis de uma conversa.
 * Permite soft-delete e lifecycle management.
 */
export type ConversationStatus = 'active' | 'archived' | 'deleted';

/**
 * Metadados de uma conversa armazenados em:
 * conversations/{conversationId}
 */
export interface Conversation {
  id: string;               // crypto.randomUUID()
  owner: string;            // Firebase UID
  title: string;
  lastMsgPreview: string;   // Trecho truncado da última mensagem
  lastMsgRole: EntryRole;   // Quem enviou a última mensagem
  lastMsgAt: number;        // Timestamp da última mensagem (para ordenação)
  createdAt: number;
  updatedAt: number;
  status: ConversationStatus;
  visibility: 'private';
}

/**
 * Campos mínimos necessários para renderizar a Sidebar.
 * NÃO inclui entries — entries NUNCA são carregadas para o sidebar.
 */
export type ConversationMeta = Pick<
  Conversation,
  'id' | 'title' | 'lastMsgPreview' | 'lastMsgRole' | 'lastMsgAt' | 'updatedAt' | 'status'
>;

// ===== Estado do Chat (Zustand) =====

/**
 * Representa uma mensagem no estado LOCAL do app (para a UI).
 * Mapeada a partir de Entry para manter compatibilidade com componentes existentes.
 */
export interface Message {
  id: string;
  role: EntryRole;
  content: string;
  timestamp: number;
  sources?: GroundingSource[];
  supports?: GroundingSupport[];
}

/** Estado do chat gerenciado pelo Zustand. */
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentConversationId: string | null;
  conversations: ConversationMeta[];
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  loadConversations: () => void;         // Inicia listener realtime da sidebar
  loadConversation: (id: string) => Promise<void>; // Carrega entries de uma conversa
  unsubscribeAll: () => void;            // Para todos os listeners quando necessário
}

/** Payload enviado ao backend proxy. */
export interface ChatRequest {
  messages: Pick<Message, 'role' | 'content'>[];
}

/** Fonte retornada pelo Google Search Grounding. */
export interface GroundingSource {
  uri: string;
  title: string;
}

/** Segmento de texto mapeado a fontes pelo Grounding (para links inline). */
export interface GroundingSupport {
  text: string;           // trecho exato do texto da resposta
  sourceIndices: number[]; // índices em sources[]
}

/** Resposta recebida do backend proxy. */
export interface ChatResponse {
  content: string;
  model: string;
  sources?: GroundingSource[];
  supports?: GroundingSupport[];
}

// ===== Auth =====

/** Usuário autenticado. */
export interface User {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/** Estado de autenticação. */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleNative: (idToken: string) => Promise<void>; // Mobile: expo-auth-session
  logout: () => Promise<void>;
}

// ===== Accounts =====

/** Perfil do usuário armazenado em accounts/{uid}. */
export interface AccountProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  plan: 'free' | 'pro';
  createdAt: number;
  metadata?: Record<string, unknown>;
}

// ===== Theme =====

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  primary: string;
  primaryVariant: string;
  error: string;
  success: string;
  userBubble: string;
  userBubbleText: string;
  aiBubble: string;
  aiBubbleText: string;
  border: string;
  inputBackground: string;
  placeholder: string;
  shadow: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

export interface ThemeState {
  mode: ThemeMode;
  theme: Theme;
  toggleTheme: () => void;
}
