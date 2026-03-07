import { jsx as _jsx } from "react/jsx-runtime";
const variantStyles = {
    primary: {
        background: 'linear-gradient(135deg, #7c5cfc, #b94cfc)',
        color: '#ffffff',
        border: 'none',
    },
    secondary: {
        background: 'transparent',
        color: '#7c5cfc',
        border: '1px solid #7c5cfc',
    },
    ghost: {
        background: 'transparent',
        color: '#9494a8',
        border: '1px solid #2a2a3e',
    },
};
const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: '13px' },
    md: { padding: '12px 24px', fontSize: '14px' },
    lg: { padding: '16px 32px', fontSize: '16px' },
};
/**
 * Botão reutilizável com variantes de estilo.
 */
export const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, fullWidth = false, style, }) => {
    return (_jsx("button", { onClick: onClick, disabled: disabled, style: {
            borderRadius: '12px',
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s ease',
            width: fullWidth ? '100%' : 'auto',
            fontFamily: 'inherit',
            ...variantStyles[variant],
            ...sizeStyles[size],
            ...style,
        }, children: children }));
};
//# sourceMappingURL=Button.js.map