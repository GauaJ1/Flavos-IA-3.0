import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// ===================================================
// Flavos IA 3.0 — Sidebar Component
// ===================================================
import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
export const Sidebar = ({ onNewChat, style }) => {
    const { mode, toggleTheme, theme } = useTheme();
    const { logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false); // Mobile toggle
    const colors = theme.colors;
    return (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setIsOpen(!isOpen), style: {
                    position: 'fixed',
                    top: 16,
                    left: 16,
                    zIndex: 300,
                    background: 'none',
                    border: 'none',
                    color: colors.text,
                    cursor: 'pointer',
                    padding: 8,
                    display: 'block', // Na web pode-se usar media query pra sumir no desktop
                }, className: "mobile-sidebar-toggle", "aria-label": "Alternar Menu", children: _jsx("span", { className: "material-symbols-rounded", children: "menu" }) }), isOpen && (_jsx("div", { onClick: () => setIsOpen(false), style: {
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 190,
                }, className: "sidebar-overlay" })), _jsxs("div", { className: `sidebar-container ${isOpen ? 'open' : ''}`, style: {
                    height: '100%',
                    width: 260,
                    background: colors.surfaceVariant,
                    borderRight: `1px solid ${colors.border}`,
                    padding: '20px 15px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'transform 0.3s ease',
                    zIndex: 200,
                    ...style,
                }, children: [_jsx("button", { onClick: () => setIsOpen(false), style: {
                            background: 'none',
                            border: 'none',
                            color: colors.text,
                            cursor: 'pointer',
                            padding: 8,
                            alignSelf: 'flex-start',
                            marginBottom: 20,
                        }, "aria-label": "Recolher Menu", children: _jsx("span", { className: "material-symbols-rounded", children: "menu" }) }), _jsxs("button", { onClick: () => {
                            onNewChat();
                            setIsOpen(false);
                        }, style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: colors.background,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            padding: '12px 16px',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontWeight: 500,
                            transition: 'background 0.2s',
                            marginBottom: 24,
                            width: '100%',
                        }, children: [_jsx("span", { className: "material-symbols-rounded", children: "add" }), _jsx("span", { children: "Novo Chat" })] }), _jsx("h3", { style: {
                            fontSize: 12,
                            color: colors.textSecondary,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            marginBottom: 12,
                            paddingLeft: 8,
                        }, children: "Seus Chats (Mock)" }), _jsx("ul", { style: {
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                            flex: 1,
                            overflowY: 'auto',
                        }, children: ['Ideias de Receitas', 'Debugação de Código', 'Plano de Estudos'].map((title, i) => (_jsxs("li", { style: {
                                padding: '10px 12px',
                                borderRadius: 8,
                                color: colors.text,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                transition: 'background 0.2s',
                                marginBottom: 4,
                            }, onMouseOver: (e) => (e.currentTarget.style.background = colors.background), onMouseOut: (e) => (e.currentTarget.style.background = 'transparent'), children: [_jsx("span", { className: "material-symbols-rounded", style: { fontSize: 18, color: colors.textSecondary }, children: "chat_bubble" }), _jsx("span", { style: { fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, children: title })] }, i))) }), _jsxs("div", { style: { marginTop: 'auto', borderTop: `1px solid ${colors.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }, children: [_jsxs("button", { onClick: toggleTheme, style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    background: 'none',
                                    border: 'none',
                                    color: colors.text,
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'left',
                                }, onMouseOver: (e) => (e.currentTarget.style.background = colors.background), onMouseOut: (e) => (e.currentTarget.style.background = 'transparent'), children: [_jsx("span", { className: "material-symbols-rounded", children: mode === 'dark' ? 'light_mode' : 'dark_mode' }), _jsx("span", { children: mode === 'dark' ? 'Tema Claro' : 'Tema Escuro' })] }), _jsxs("button", { onClick: logout, style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    background: 'none',
                                    border: 'none',
                                    color: colors.error,
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'left',
                                }, onMouseOver: (e) => (e.currentTarget.style.background = colors.background), onMouseOut: (e) => (e.currentTarget.style.background = 'transparent'), children: [_jsx("span", { className: "material-symbols-rounded", children: "logout" }), _jsx("span", { children: "Sair" })] })] })] })] }));
};
//# sourceMappingURL=Sidebar.js.map