import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@flavos/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy de desenvolvimento — redireciona /api para o backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
