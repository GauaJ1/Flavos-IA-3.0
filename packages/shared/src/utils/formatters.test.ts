// ===================================================
// Flavos IA 3.0 — Tests: formatters
// ===================================================

import { describe, it, expect } from 'vitest';
import {
  generateId,
  formatTimestamp,
  truncateText,
  isBlank,
} from '../utils/formatters';

describe('generateId', () => {
  it('deve gerar IDs únicos', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('deve retornar uma string não vazia', () => {
    const id = generateId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });
});

describe('formatTimestamp', () => {
  it('deve formatar horário de hoje como HH:MM', () => {
    const now = Date.now();
    const formatted = formatTimestamp(now);
    // Deve conter formato de hora (ex: "14:30")
    expect(formatted).toMatch(/\d{2}:\d{2}/);
  });
});

describe('truncateText', () => {
  it('deve truncar texto longo', () => {
    const text = 'Lorem ipsum dolor sit amet consectetur';
    const result = truncateText(text, 15);
    expect(result.length).toBeLessThanOrEqual(15);
    expect(result).toContain('...');
  });

  it('deve retornar texto original se menor que maxLength', () => {
    const text = 'Olá';
    expect(truncateText(text, 100)).toBe(text);
  });
});

describe('isBlank', () => {
  it('deve retornar true para string vazia', () => {
    expect(isBlank('')).toBe(true);
  });

  it('deve retornar true para string com espaços', () => {
    expect(isBlank('   ')).toBe(true);
  });

  it('deve retornar true para null/undefined', () => {
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
  });

  it('deve retornar false para texto válido', () => {
    expect(isBlank('Olá')).toBe(false);
  });
});
