// ===================================================
// Flavos IA 3.0 — Metro Bundler Config (Monorepo)
// ===================================================
//
// Configurado para funcionar em monorepo Turborepo/npm Workspaces.
// O Metro precisa explicitamente ser instruído a:
//   1. Monitorar (watchFolders) os pacotes compartilhados fora de packages/mobile.
//   2. Resolver node_modules de forma correta, priorizando os módulos locais
//      mas usando o node_modules raiz quando necessário (hoisting pattern).
// ===================================================

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Raiz do monorepo (duas pastas acima de packages/mobile)
const monorepoRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(__dirname);

// ─── Monorepo: Watchfolders ─────────────────────────────────────────────────
// Instrui o Metro a vigiar as mudanças nos pacotes fora desta pasta
config.watchFolders = [monorepoRoot];

// ─── Monorepo: Resolver ─────────────────────────────────────────────────────
// O resolver precisa procurar node_modules na pasta do pacote E na raiz
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// ─── Monorepo: Alias para @flavos/shared ─────────────────────────────────────
// Garante que @flavos/shared sempre resolve para o código-fonte correto
config.resolver.extraNodeModules = {
  '@flavos/shared': path.resolve(monorepoRoot, 'packages/shared/src'),
};

module.exports = config;
