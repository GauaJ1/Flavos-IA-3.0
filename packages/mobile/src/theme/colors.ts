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
  background: '#0b101a',
  surface: '#0b101a',
  surfaceVariant: '#1d2434',
  text: '#edf3ff',
  textSecondary: '#97a7ca',
  textInverse: '#090c13',
  primary: '#1d7efd',
  primaryVariant: '#28a745',
  error: '#d62939',
  success: '#28a745',
  userBubble: '#1d2434',
  userBubbleText: '#edf3ff',
  aiBubble: 'transparent',
  aiBubbleText: '#edf3ff',
  border: '#2a354d',
  inputBackground: '#1d2434',
  placeholder: '#a5b4cc',
  shadow: 'rgba(0, 0, 0, 0.5)',
};

export const lightColors: ColorPalette = {
  background: '#e8eef8',
  surface: '#e8eef8',
  surfaceVariant: '#d0daf0',
  text: '#090c13',
  textSecondary: '#6e7ea5',
  textInverse: '#edf3ff',
  primary: '#1d7efd',
  primaryVariant: '#28a745',
  error: '#d62939',
  success: '#28a745',
  userBubble: '#d0daf0',
  userBubbleText: '#090c13',
  aiBubble: 'transparent',
  aiBubbleText: '#090c13',
  border: '#c4d3eb',
  inputBackground: '#d0daf0',
  placeholder: '#606982',
  shadow: 'rgba(0, 0, 0, 0.08)',
};
