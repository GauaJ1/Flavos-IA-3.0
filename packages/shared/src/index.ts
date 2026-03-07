// ===================================================
// Flavos IA 3.0 — Shared Package Entry Point
// ===================================================

// Types
export * from './types';

// Hooks
export { useChat } from './hooks/useChat';
export { useAuth } from './hooks/useAuth';
export { useTheme } from './hooks/useTheme';

// Services
export { aiService } from './services/aiService';

// Components
export { ChatMessage } from './components/ChatMessage';
export { ChatInput } from './components/ChatInput';
export { MessageList } from './components/MessageList';
export { Button } from './components/Button';
export { Sidebar } from './components/Sidebar';

// Utils
export {
  generateId,
  formatTimestamp,
  truncateText,
  isBlank,
} from './utils/formatters';
export {
  API_BASE_URL,
  API_ENDPOINTS,
  GEMINI_MODEL,
  APP_CONFIG,
} from './utils/constants';
