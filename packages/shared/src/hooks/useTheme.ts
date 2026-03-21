// ===================================================
// Flavos IA 3.0 — useTheme Hook (Zustand Store)
// ===================================================

import { create } from 'zustand';
import type { Theme, ThemeColors, ThemeMode, ThemeState } from '../types';

/**
 * Paleta de cores — Tema Escuro (Baseado no style.css fornecido)
 */
const darkColors: ThemeColors = {
  background: '#101623',          // --primary-color
  surface: '#101623',
  surfaceVariant: '#283045',      // --secondary-color

  text: '#edf3ff',                // --text-color
  textSecondary: '#97a7ca',       // --subheading-color
  textInverse: '#090c13',

  primary: '#1d7efd',             // Azul de destaque
  primaryVariant: '#28a745',      // Verde floresta do degradê

  error: '#d62939',
  success: '#28a745',

  // No minimalista Gemini, as bolhas somem ou ficam muito sutis
  userBubble: '#283045',
  userBubbleText: '#edf3ff',
  aiBubble: 'transparent',
  aiBubbleText: '#edf3ff',

  border: '#333e58',              // --secondary-hover-color
  inputBackground: '#283045',
  placeholder: '#c3cdde',         // --placeholder-color
  shadow: 'rgba(0, 0, 0, 0.4)',
};

/**
 * Paleta de cores — Tema Claro (Baseado no style.css fornecido)
 */
const lightColors: ThemeColors = {
  background: '#f3f7ff',          // --primary-color (light)
  surface: '#f3f7ff',
  surfaceVariant: '#dce6f9',      // --secondary-color (light)

  text: '#090c13',                // --text-color
  textSecondary: '#7b8cae',       // --subheading-color
  textInverse: '#edf3ff',

  primary: '#1d7efd',
  primaryVariant: '#28a745',

  error: '#d62939',
  success: '#28a745',

  userBubble: '#dce6f9',
  userBubbleText: '#090c13',
  aiBubble: 'transparent',
  aiBubbleText: '#090c13',

  border: '#d2ddf2',              // --secondary-hover-color
  inputBackground: '#dce6f9',
  placeholder: '#606982',         // --placeholder-color
  shadow: 'rgba(0, 0, 0, 0.08)',
};

function createTheme(mode: ThemeMode): Theme {
  return {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
  };
}

const isWeb = typeof window !== 'undefined' && 'localStorage' in window;

const getInitialMode = (): ThemeMode => {
  if (isWeb) {
    try {
      const saved = window.localStorage.getItem('flavos_theme_mode');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {
      // Ignore errors (e.g. private mode)
    }
  }
  return 'dark'; // Padrão inicial
};

/**
 * Store de tema com Zustand.
 * Persiste a preferência no localStorage (web) e alterna entre claro/escuro.
 */
export const useTheme = create<ThemeState>((set) => {
  const initialMode = getInitialMode();
  
  return {
    mode: initialMode,
    theme: createTheme(initialMode),

    toggleTheme: () => {
      set((state) => {
        const newMode: ThemeMode = state.mode === 'dark' ? 'light' : 'dark';
        if (isWeb) {
          try {
            window.localStorage.setItem('flavos_theme_mode', newMode);
          } catch (e) {}
        }
        return {
          mode: newMode,
          theme: createTheme(newMode),
        };
      });
    },

    setMode: (mode: ThemeMode) => {
      if (isWeb) {
        try {
          window.localStorage.setItem('flavos_theme_mode', mode);
        } catch (e) {}
      }
      set({
        mode,
        theme: createTheme(mode),
      });
    },
  };
});
