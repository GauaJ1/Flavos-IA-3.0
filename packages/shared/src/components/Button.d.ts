import React from 'react';
interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    fullWidth?: boolean;
    style?: React.CSSProperties;
}
/**
 * Botão reutilizável com variantes de estilo.
 */
export declare const Button: React.FC<ButtonProps>;
export {};
//# sourceMappingURL=Button.d.ts.map