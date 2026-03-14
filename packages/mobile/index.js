// ===================================================
// Flavos IA 3.0 — Mobile App Entry Point
// ===================================================
//
// NOTA MONOREPO: Não use "expo/AppEntry.js" como "main" no package.json.
// Em monorepos com Turborepo/Workspaces, o node_modules raiz contém o
// expo/AppEntry.js que resolve "../../App" de forma INCORRETA (vai para a
// raiz do monorepo, não para packages/mobile/).
//
// A solução correta é criar este index.js aqui e apontar "main": "index.js"
// no package.json, chamando registerRootComponent diretamente.
// ===================================================

import { registerRootComponent } from 'expo';
import App from './src/App';

// registerRootComponent chama AppRegistry.registerComponent('main', () => App)
// e garante que o ambiente está configurado corretamente (AsyncStorage, etc.)
registerRootComponent(App);
