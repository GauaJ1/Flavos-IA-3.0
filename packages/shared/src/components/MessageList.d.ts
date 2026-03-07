import React from 'react';
import type { Message } from '../types';
interface MessageListProps {
    messages: Message[];
    isLoading?: boolean;
    /** Platform-specific styles */
    style?: {
        container?: React.CSSProperties;
        emptyState?: React.CSSProperties;
        loadingIndicator?: React.CSSProperties;
    };
}
/**
 * Lista de mensagens do chat com auto-scroll.
 * Exibe estado vazio quando não há mensagens.
 * Mostra indicador de digitação quando a IA está gerando resposta.
 */
export declare const MessageList: React.FC<MessageListProps>;
export {};
//# sourceMappingURL=MessageList.d.ts.map