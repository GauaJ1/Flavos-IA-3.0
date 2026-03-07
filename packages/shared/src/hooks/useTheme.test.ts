// ===================================================
// Flavos IA 3.0 — Tests: useTheme Hook
// ===================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { useTheme } from '../hooks/useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    useTheme.setState({
      mode: 'dark',
      theme: { mode: 'dark', colors: useTheme.getState().theme.colors },
    });
  });

  it('deve começar com tema escuro', () => {
    const state = useTheme.getState();
    expect(state.mode).toBe('dark');
    expect(state.theme.mode).toBe('dark');
  });

  it('deve alternar para tema claro', () => {
    useTheme.getState().toggleTheme();
    const state = useTheme.getState();
    expect(state.mode).toBe('light');
    expect(state.theme.mode).toBe('light');
  });

  it('deve alternar de volta para escuro', () => {
    useTheme.getState().toggleTheme(); // → light
    useTheme.getState().toggleTheme(); // → dark
    const state = useTheme.getState();
    expect(state.mode).toBe('dark');
  });

  it('deve ter cores distintas para cada tema', () => {
    const darkBg = useTheme.getState().theme.colors.background;
    useTheme.getState().toggleTheme();
    const lightBg = useTheme.getState().theme.colors.background;
    expect(darkBg).not.toBe(lightBg);
  });
});
