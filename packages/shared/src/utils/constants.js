// ===================================================
// Flavos IA 3.0 — Constants
// ===================================================
/**
 * URL base do backend proxy.
 * Em produção, será substituída pela URL do deploy.
 */
export const API_BASE_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:3001';
/**
 * Endpoints da API.
 */
export const API_ENDPOINTS = {
    CHAT_GENERATE: '/api/chat/generate',
};
/**
 * Nome do modelo Gemini utilizado (referência para o frontend).
 */
export const GEMINI_MODEL = 'gemini-3.1-flash';
/**
 * Configurações do app.
 */
export const APP_CONFIG = {
    APP_NAME: 'Flavos IA',
    APP_VERSION: '3.0.0',
    MAX_MESSAGE_LENGTH: 4000,
    CHAT_HISTORY_LIMIT: 50,
};
//# sourceMappingURL=constants.js.map