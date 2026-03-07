/**
 * URL base do backend proxy.
 * Em produção, será substituída pela URL do deploy.
 */
export declare const API_BASE_URL: any;
/**
 * Endpoints da API.
 */
export declare const API_ENDPOINTS: {
    readonly CHAT_GENERATE: "/api/chat/generate";
};
/**
 * Nome do modelo Gemini utilizado (referência para o frontend).
 */
export declare const GEMINI_MODEL = "gemini-3.1-flash";
/**
 * Configurações do app.
 */
export declare const APP_CONFIG: {
    readonly APP_NAME: "Flavos IA";
    readonly APP_VERSION: "3.0.0";
    readonly MAX_MESSAGE_LENGTH: 4000;
    readonly CHAT_HISTORY_LIMIT: 50;
};
//# sourceMappingURL=constants.d.ts.map