import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTheme } from '../hooks/useTheme';
export const ChatMessage = ({ message, style }) => {
    const isUser = message.role === 'user';
    const { theme } = useTheme();
    const colors = theme.colors;
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: 16,
            padding: '16px 20px',
            width: '100%',
            margin: '0 auto',
            maxWidth: 980,
            ...style?.container,
        }, children: [_jsx("div", { style: {
                    width: 36,
                    height: 36,
                    borderRadius: isUser ? '50%' : 12, // User = circle, AI = rounded rect
                    background: isUser
                        ? colors.surfaceVariant
                        : 'linear-gradient(to right, #1d7efd, #28a745)', // Gradiente Flavos IA
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: '#fff',
                    ...style?.avatar,
                }, children: isUser ? (_jsx("span", { className: "material-symbols-rounded", style: { fontSize: 20 }, children: "person" })) : (_jsx("span", { style: { fontWeight: 'bold', fontSize: 16 }, children: "F" })) }), _jsx("div", { style: {
                    flex: 1,
                    maxWidth: isUser ? '75%' : '100%',
                    background: isUser ? colors.surfaceVariant : 'transparent',
                    padding: isUser ? '12px 16px' : '6px 0',
                    borderRadius: isUser ? '16px 4px 16px 16px' : 0,
                    color: colors.text,
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-line',
                    ...style?.bubble,
                }, children: _jsx("span", { style: { ...style?.text }, children: message.content }) })] }));
};
//# sourceMappingURL=ChatMessage.js.map