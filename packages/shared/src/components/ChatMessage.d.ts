import React from 'react';
import type { Message } from '../types';
interface ChatMessageProps {
    message: Message;
    style?: {
        container?: React.CSSProperties;
        bubble?: React.CSSProperties;
        text?: React.CSSProperties;
        avatar?: React.CSSProperties;
    };
}
export declare const ChatMessage: React.FC<ChatMessageProps>;
export {};
//# sourceMappingURL=ChatMessage.d.ts.map