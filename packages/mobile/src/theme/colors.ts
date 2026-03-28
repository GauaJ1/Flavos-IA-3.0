// ===================================================
// Flavos IA 3.0 — Color Palettes (React Native)
// Mirror of packages/shared/src/hooks/useTheme.ts
// ===================================================

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  primary: string;
  primaryVariant: string;
  error: string;
  success: string;
  userBubble: string;
  userBubbleText: string;
  aiBubble: string;
  aiBubbleText: string;
  border: string;
  inputBackground: string;
  placeholder: string;
  shadow: string;
}

export const darkColors: ColorPalette = {
  background: '#101623',
  surface: '#101623',
  surfaceVariant: '#1a2236',
  text: '#edf3ff',
  textSecondary: '#97a7ca',
  textInverse: '#090c13',
  primary: '#1d7efd',
  primaryVariant: '#28a745',
  error: '#e53935',
  success: '#28a745',
  userBubble: '#1e2d45',
  userBubbleText: '#edf3ff',
  aiBubble: 'transparent',
  aiBubbleText: '#edf3ff',
  border: '#2a3650',
  inputBackground: '#1a2236',
  placeholder: '#a5b4cc',
  shadow: 'rgba(0, 0, 0, 0.5)',
};

export const lightColors: ColorPalette = {
  background: '#f4f7ff',
  surface: '#f4f7ff',
  surfaceVariant: '#dce8f8',
  text: '#0b0f1a',
  textSecondary: '#6b7da0',
  textInverse: '#edf3ff',
  primary: '#1d7efd',
  primaryVariant: '#28a745',
  error: '#d32f2f',
  success: '#28a745',
  userBubble: '#dce8f8',
  userBubbleText: '#0b0f1a',
  aiBubble: 'transparent',
  aiBubbleText: '#0b0f1a',
  border: '#c8d6ee',
  inputBackground: '#dce8f8',
  placeholder: '#7a87a8',
  shadow: 'rgba(0, 0, 0, 0.08)',
};
