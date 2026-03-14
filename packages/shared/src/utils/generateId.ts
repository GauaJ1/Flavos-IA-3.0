/**
 * Gera um UUID v4 compatível com Web e React Native (Hermes).
 *
 * - Usa crypto.randomUUID() se disponível (browsers modernos, RN >= 0.73 com Hermes)
 * - Fallback para Math.random() em ambientes sem Web Crypto API
 */
export function generateId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  // Fallback: RFC 4122 v4 via Math.random()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
