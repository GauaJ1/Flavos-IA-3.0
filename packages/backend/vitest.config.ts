import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // 'forks' usa processos separados para cada arquivo de teste.
    // Garante isolamento real de módulos entre arquivos que usam vi.mock em módulos
    // compartilhados (ex: server.ts/auth.ts importados em múltiplos arquivos de teste).
    pool: 'forks',
    // Timeout para testes HTTP com payloads grandes
    testTimeout: 15_000,
    // Executa arquivos de teste em sequência para evitar race conditions nos rate limiters
    fileParallelism: false,
  },
});
