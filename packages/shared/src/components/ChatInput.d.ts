import React from 'react';
interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
    style?: {
        container?: React.CSSProperties;
        wrapper?: React.CSSProperties;
        input?: React.CSSProperties;
        button?: React.CSSProperties;
    };
}
export declare const ChatInput: React.FC<ChatInputProps>;
export {};
//# sourceMappingURL=ChatInput.d.ts.map