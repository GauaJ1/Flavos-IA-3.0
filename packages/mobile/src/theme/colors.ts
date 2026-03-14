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
  surfaceVariant: '#283045',
  text: '#edf3ff',
  textSecondary: '#97a7ca',
  textInverse: '#090c13',
  primary: '#1d7efd',
  primaryVariant: '#28a745',
  error: '#d62939',
  success: '#28a745',
  userBubble: '#283045',
  userBubbleText: '#edf3ff',
  aiBubble: 'transparent',
  aiBubbleText: '#edf3ff',
  border: '#333e58',
  inputBackground: '#283045',
  placeholder: '#c3cdde',
  shadow: 'rgba(0, 0, 0, 0.4)',
};

export const lightColors: ColorPalette = {
  background: '#f3f7ff',
  surface: '#f3f7ff',
  surfaceVariant: '#dce6f9',
  text: '#090c13',
  textSecondary: '#7b8cae',
  textInverse: '#edf3ff',
  primary: '#1d7efd',
  primaryVariant: '#28a745',
  error: '#d62939',
  success: '#28a745',
  userBubble: '#dce6f9',
  userBubbleText: '#090c13',
  aiBubble: 'transparent',
  aiBubbleText: '#090c13',
  border: '#d2ddf2',
  inputBackground: '#dce6f9',
  placeholder: '#606982',
  shadow: 'rgba(0, 0, 0, 0.08)',
};
