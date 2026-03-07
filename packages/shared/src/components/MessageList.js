import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ===================================================
// Flavos IA 3.0 — MessageList Component
// ===================================================
import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
/**
 * Lista de mensagens do chat com auto-scroll.
 * Exibe estado vazio quando não há mensagens.
 * Mostra indicador de digitação quando a IA está gerando resposta.
 */
export const MessageList = ({ messages, isLoading = false, style, }) => {
    const bottomRef = useRef(null);
    // Auto-scroll para o fim quando novas mensagens chegam
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);
    return (_jsxs("div", { style: {
            flex: 1,
            overflowY: 'auto',
            padding: '16px 0',
            ...style?.container,
        }, children: [messages.length === 0 && (_jsxs("div", { style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    opacity: 0.5,
                    textAlign: 'center',
                    padding: '40px 20px',
                    ...style?.emptyState,
                }, children: [_jsx("div", { style: { fontSize: '48px', marginBottom: '16px' }, children: "\uD83D\uDCAC" }), _jsx("p", { style: { fontSize: '16px', color: '#9494a8' }, children: "Comece uma conversa com a IA!" }), _jsx("p", { style: { fontSize: '13px', color: '#6a6a80', marginTop: '8px' }, children: "Powered by Gemini 3.1-flash" })] })), messages.map((msg) => (_jsx(ChatMessage, { message: msg }, msg.id))), isLoading && (_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    ...style?.loadingIndicator,
                }, children: [_jsx("div", { style: {
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7c5cfc, #b94cfc)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: 700,
                            marginRight: 8,
                        }, children: "F" }), _jsx("div", { style: {
                            padding: '12px 16px',
                            borderRadius: '18px 18px 18px 4px',
                            background: '#1e1e2e',
                            color: '#9494a8',
                            fontSize: '14px',
                        }, children: _jsx("span", { className: "typing-indicator", children: "Pensando..." }) })] })), _jsx("div", { ref: bottomRef })] }));
};
//# sourceMappingURL=MessageList.js.map