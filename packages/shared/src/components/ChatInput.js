import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ===================================================
// Flavos IA 3.0 — ChatInput Component (Minimalista)
// ===================================================
import { useState } from 'react';
import { APP_CONFIG } from '../utils/constants';
export const ChatInput = ({ onSend, disabled = false, placeholder = 'Pergunte qualquer coisa', style, }) => {
    const [text, setText] = useState('');
    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed || disabled)
            return;
        onSend(trimmed);
        setText('');
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    const isValid = text.trim().length > 0 && !disabled;
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 20px',
            width: '100%',
            maxWidth: 980,
            margin: '0 auto',
            ...style?.container,
        }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    height: 56,
                    background: 'var(--input-bg)',
                    borderRadius: 130, // Pílula como no CSS original
                    padding: '0 8px 0 24px',
                    ...style?.wrapper,
                }, children: [_jsx("input", { type: "text", value: text, onChange: (e) => setText(e.target.value), onKeyDown: handleKeyDown, placeholder: placeholder, disabled: disabled, maxLength: APP_CONFIG.MAX_MESSAGE_LENGTH, style: {
                            flex: 1,
                            height: '100%',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text)',
                            fontSize: '1rem',
                            outline: 'none',
                            fontFamily: 'inherit',
                            ...style?.input,
                        } }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12 }, children: [_jsx("button", { type: "button", style: {
                                    width: 45,
                                    height: 45,
                                    borderRadius: '50%',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.3s',
                                }, onMouseOver: (e) => (e.currentTarget.style.background = 'var(--border)'), onMouseOut: (e) => (e.currentTarget.style.background = 'transparent'), children: _jsx("span", { className: "material-symbols-rounded", children: "attach_file" }) }), _jsx("button", { onClick: handleSend, disabled: !isValid, style: {
                                    width: 45,
                                    height: 45,
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: isValid ? 'var(--primary)' : 'transparent',
                                    color: isValid ? '#fff' : 'var(--placeholder)',
                                    cursor: isValid ? 'pointer' : 'default',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s',
                                    ...style?.button,
                                }, children: _jsx("span", { className: "material-symbols-rounded", children: "send" }) })] })] }), _jsx("p", { style: {
                    fontSize: '0.8rem',
                    color: 'var(--placeholder)',
                    marginTop: 12,
                    textAlign: 'center',
                }, children: "Atualmente Flavos IA pode cometer erros, reveja as respostas." })] }));
};
//# sourceMappingURL=ChatInput.js.map