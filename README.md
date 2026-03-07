# 🤖 Flavos IA 3.0

> Chat inteligente movido a **Gemini 3.1-flash** — React (web) + React Native (mobile) em um monorepo Turborepo.

## 📁 Estrutura

```
packages/
├── shared/     # Tipos, hooks, serviços, componentes compartilhados
├── backend/    # Proxy Express → @google/genai (Gemini 3.1-flash)
├── web/        # App web (Vite + React)
└── mobile/     # App mobile (Expo + React Native)
```

## 🚀 Como Rodar

### 1. Pré-requisitos
- **Node.js** ≥ 18
- **npm** ≥ 10
- **Chave da API do Gemini** — [obtenha aqui](https://aistudio.google.com/apikey)

### 2. Configurar Variáveis de Ambiente
```bash
# Na raiz do projeto
cp .env.example .env

# Edite o .env e preencha:
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-3.1-flash
PORT=3001
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Rodar Backend + Web (desenvolvimento)
```bash
# Terminal 1 — Backend proxy
npm run dev:backend

# Terminal 2 — Web app
npm run dev:web
```

- **Backend**: http://localhost:3001
- **Web**: http://localhost:5173
- **Health check**: http://localhost:3001/api/health

### 5. Testar o Chat
1. Abra http://localhost:5173
2. Clique em **"💬 Iniciar Chat"**
3. Digite uma mensagem e envie
4. A resposta do **Gemini 3.1-flash** aparecerá na conversa

### 6. Rodar Mobile (opcional)
```bash
npm run dev:mobile
# ou
cd packages/mobile && npx expo start
```

## 🧪 Testes
```bash
# Rodar todos os testes
npm test

# Testes do shared apenas
cd packages/shared && npx vitest run
```

## 🏗️ Scripts Disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia todos os pacotes em paralelo |
| `npm run dev:web` | Apenas o web app |
| `npm run dev:backend` | Apenas o backend proxy |
| `npm run dev:mobile` | Apenas o mobile |
| `npm run build` | Build de produção |
| `npm test` | Roda todos os testes |

## 🔮 Próximos Passos (TODO)

- [ ] **Firebase Auth** — Login com email/Google (placeholders já preparados)
- [ ] **Firebase Firestore** — Persistência de conversas
- [ ] **Streaming** — Respostas do Gemini em tempo real
- [ ] **Markdown rendering** — Formatação rica nas respostas
- [ ] **Histórico de conversas** — Múltiplas sessões de chat
- [ ] **PWA** — Service worker + manifest para instalação

## 📝 Licença

Projeto privado — Flavos IA © 2026
