// ===================================================
// Flavos IA 3.0 — Types
// ===================================================

/**
 * Representa uma mensagem individual no chat.
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/**
 * Estado do chat gerenciado pelo Zustand store.
 */
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}

/**
 * Payload enviado ao backend proxy.
 */
export interface ChatRequest {
  messages: Pick<Message, 'role' | 'content'>[];
}

/**
 * Resposta recebida do backend proxy.
 */
export interface ChatResponse {
  content: string;
  model: string;
}

// ===================================================
// TODO: Firebase — User & Auth Types
// ===================================================

/**
 * Placeholder para o usuário autenticado.
 * TODO: Firebase — Substituir pelo tipo do Firebase Auth User.
 */
export interface User {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  // TODO: Firebase — Adicionar campos como emailVerified, metadata, etc.
}

/**
 * Estado de autenticação.
 * TODO: Firebase — Conectar ao onAuthStateChanged do Firebase.
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // TODO: Firebase — Adicionar signIn, signOut, signUp
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ===================================================
// Theme Types
// ===================================================

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceVariant: string;

  // Text
  text: string;
  textSecondary: string;
  textInverse: string;

  // Brand
  primary: string;
  primaryVariant: string;

  // Semantic
  error: string;
  success: string;

  // Chat
  userBubble: string;
  userBubbleText: string;
  aiBubble: string;
  aiBubbleText: string;

  // UI
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
