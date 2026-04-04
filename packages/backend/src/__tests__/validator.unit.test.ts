// ===================================================
// Unit tests — chat payload validation helpers
// Testa as funções puras sem HTTP overhead.
// ===================================================

import { describe, it, expect } from 'vitest';
import {
  isValidBase64,
  base64DecodedBytes,
  MAX_MESSAGES,
  MAX_MSG_CHARS,
  MAX_ATTACHMENT_DECODED_BYTES,
  MAX_TOTAL_ATTACHMENT_DECODED_BYTES,
  ALLOWED_MIME_TYPES,
} from '../routes/chat.js';

describe('isValidBase64', () => {
  it('aceita base64 válido sem padding', () => {
    expect(isValidBase64('AAAA')).toBe(true);
  });

  it('aceita base64 com padding simples', () => {
    expect(isValidBase64('AAA=')).toBe(true);
  });

  it('aceita base64 com padding duplo', () => {
    expect(isValidBase64('AA==')).toBe(true);
  });

  it('rejeita string vazia', () => {
    expect(isValidBase64('')).toBe(false);
  });

  it('rejeita charset inválido', () => {
    expect(isValidBase64('A!A=')).toBe(false);
  });

  it('rejeita comprimento não múltiplo de 4', () => {
    expect(isValidBase64('AAA')).toBe(false);
  });

  it('rejeita mais de dois chars de padding', () => {
    expect(isValidBase64('A===')).toBe(false);
  });
});

describe('base64DecodedBytes', () => {
  it('calcula corretamente sem padding', () => {
    // 'AAAA' = 4 chars → 3 bytes decoded
    expect(base64DecodedBytes('AAAA')).toBe(3);
  });

  it('calcula corretamente com 1 padding', () => {
    // 'AAA=' = 4 chars, 1 padding → 2 bytes
    expect(base64DecodedBytes('AAA=')).toBe(2);
  });

  it('calcula corretamente com 2 padding', () => {
    // 'AA==' = 4 chars, 2 padding → 1 byte
    expect(base64DecodedBytes('AA==')).toBe(1);
  });

  it('detecta quando ultrapassa MAX_ATTACHMENT_DECODED_BYTES', () => {
    // Gera string base64 que representa > 4MB decoded
    // 4MB decoded = 4*1024*1024 = 4,194,304 bytes
    // base64 necessário = ceil(4194304/3)*4 = 5,592,408 chars
    // Usamos 5_592_408 (múltiplo de 4) → > 4MB decoded
    const bigB64 = 'A'.repeat(5_592_408); // múltiplo de 4 ✓
    expect(base64DecodedBytes(bigB64)).toBeGreaterThan(MAX_ATTACHMENT_DECODED_BYTES);
  });
});

describe('Constantes de segurança', () => {
  it('MAX_MESSAGES é razoável para uso real', () => {
    expect(MAX_MESSAGES).toBeGreaterThanOrEqual(50);
    expect(MAX_MESSAGES).toBeLessThanOrEqual(200);
  });

  it('MAX_MSG_CHARS impede mensagens gigantes', () => {
    expect(MAX_MSG_CHARS).toBeLessThanOrEqual(50_000);
  });

  it('MAX_TOTAL_ATTACHMENT < o que 10mb base64 pode representar', () => {
    // 10mb base64 ≈ 7.5MB decoded.
    // MAX_TOTAL deve ser < 7.5MB para que o validator possa ser acionado
    // antes do body parser rejeitar com 413.
    const maxDecodedFrom10mbParser = 10 * 1024 * 1024 * 0.75;
    expect(MAX_TOTAL_ATTACHMENT_DECODED_BYTES).toBeLessThan(maxDecodedFrom10mbParser);
  });

  it('ALLOWED_MIME_TYPES não inclui SVG', () => {
    expect(ALLOWED_MIME_TYPES.has('image/svg+xml')).toBe(false);
  });

  it('ALLOWED_MIME_TYPES não inclui tipos de script', () => {
    expect(ALLOWED_MIME_TYPES.has('application/javascript')).toBe(false);
    expect(ALLOWED_MIME_TYPES.has('text/html')).toBe(false);
  });
});
