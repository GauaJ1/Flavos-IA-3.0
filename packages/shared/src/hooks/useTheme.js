// ===================================================
// Flavos IA 3.0 — useTheme Hook (Zustand Store)
// ===================================================
import { create } from 'zustand';
/**
 * Paleta de cores — Tema Escuro (Baseado no style.css fornecido)
 */
const darkColors = {
    background: '#101623', // --primary-color
    surface: '#101623',
    surfaceVariant: '#283045', // --secondary-color
    text: '#edf3ff', // --text-color
    textSecondary: '#97a7ca', // --subheading-color
    textInverse: '#090c13',
    primary: '#1d7efd', // Azul de destaque
    primaryVariant: '#28a745', // Verde floresta do degradê
    error: '#d62939',
    success: '#28a745',
    // No minimalista Gemini, as bolhas somem ou ficam muito sutis
    userBubble: '#283045',
    userBubbleText: '#edf3ff',
    aiBubble: 'transparent',
    aiBubbleText: '#edf3ff',
    border: '#333e58', // --secondary-hover-color
    inputBackground: '#283045',
    placeholder: '#c3cdde', // --placeholder-color
    shadow: 'rgba(0, 0, 0, 0.4)',
};
/**
 * Paleta de cores — Tema Claro (Baseado no style.css fornecido)
 */
const lightColors = {
    background: '#f3f7ff', // --primary-color (light)
    surface: '#f3f7ff',
    surfaceVariant: '#dce6f9', // --secondary-color (light)
    text: '#090c13', // --text-color
    textSecondary: '#7b8cae', // --subheading-color
    textInverse: '#edf3ff',
    primary: '#1d7efd',
    primaryVariant: '#28a745',
    error: '#d62939',
    success: '#28a745',
    userBubble: '#dce6f9',
    userBubbleText: '#090c13',
    aiBubble: 'transparent',
    aiBubbleText: '#090c13',
    border: '#d2ddf2', // --secondary-hover-color
    inputBackground: '#dce6f9',
    placeholder: '#606982', // --placeholder-color
    shadow: 'rgba(0, 0, 0, 0.08)',
};
function createTheme(mode) {
    return {
        mode,
        colors: mode === 'dark' ? darkColors : lightColors,
    };
}
/**
 * Store de tema com Zustand.
 * Persiste a preferência e alterna entre claro/escuro.
 */
export const useTheme = create((set) => ({
    mode: 'dark', // Padrão
    theme: createTheme('dark'),
    toggleTheme: () => {
        set((state) => {
            const newMode = state.mode === 'dark' ? 'light' : 'dark';
            return {
                mode: newMode,
                theme: createTheme(newMode),
            };
        });
    },
}));
//# sourceMappingURL=useTheme.js.map