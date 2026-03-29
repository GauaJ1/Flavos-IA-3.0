module.exports = {
  apps: [
    {
      name: 'flavos-backend',
      script: 'dist/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '650M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // ── Obrigatório para o Chat funcionar ──────────────
        GEMINI_API_KEY: 'PREENCHER_NA_VPS',
        GEMINI_MODEL: 'gemini-2.5-flash',
        VITE_FIREBASE_API_KEY: 'PREENCHER_NA_VPS',
        FIREBASE_PROJECT_ID: 'flavos-ia-3',
        // ── Obrigatório para a Lixeira (cron) funcionar ───
        // CLEANUP_SECRET: 'PREENCHER_NA_VPS',
        // FIREBASE_CLIENT_EMAIL: 'PREENCHER_NA_VPS',
        // FIREBASE_PRIVATE_KEY: 'PREENCHER_NA_VPS',
      }
    }
  ]
};
