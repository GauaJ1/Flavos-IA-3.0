# 🚀 Flavos IA 3.0 – **Phase 3 em Andamento!** 🎉  

![Banner](Banner_Flavos_3.png)

## 🔄 **O que foi feito até hoje (15/03/2026)**

Implementação completa da Fase 3 de Mídia, Pensamentos da IA e melhorias mobile:

- ✅ **Gemini Thoughts**: Exibição minimalista de pensamentos do modelo ("> Pensamento") com toggle colapsável, web e mobile.
- ✅ **Upload de Mídia**: Imagens, PDFs, áudio e vídeo enviados inline ao Gemini via base64. Metadados salvos no Firestore.
- ✅ **Visualizadores Nativos**: `<audio>/<video>` na web; `expo-audio` e `expo-video` no mobile com play/pause nativo.
- ✅ **Bottom-sheet de Anexos (Mobile)**: Modal estilizado com ícones MaterialIcons e fonte Outfit substituindo Alert.alert.
- ✅ **Code Blocks Aprimorados**: Highlight sintático tema Dracula por linguagem, botão de copiar e download com extensão correta.
- ✅ **Firebase Auth Persistência**: `initializeAuth` + `AsyncStorage` para manter sessão entre restarts no Expo.
- ✅ **Migração expo-av → expo-audio + expo-video**: APIs modernas sem avisos de depreciação.

---

## 🛠️ Roadmap de Desenvolvimento (Fases)

### 🔹 Fase 1: Fundação & Monorepo
- [x] Configuração centralizada (Turborepo + TS).
- [x] Shared package com hooks, tipos e componentes base.
- [x] Backend proxy para requisições seguras.
- [x] UI/UX 3.0 Minimalista (Web).

### 🔸 Fase 2: Persistência & Mobile (CONCLUÍDA)
- [x] Integração completa com **Firebase/Firestore**.
- [x] Renderização e polimento da versão **Mobile (Expo)**.
- [x] Histórico de mensagens real-time.
- [x] **Google Search Grounding** para respostas embasadas.

### 🔺 Fase 3: Mídia & Funcionalidades Avançadas (EM ANDAMENTO)
- [x] Upload de arquivos (PDF, imagens, áudio, vídeo).
- [x] Visualizadores de mídia nativos no chat (web + mobile).
- [x] Gemini Thoughts — resumos de pensamento minimalistas.
- [x] Code blocks com Dracula + download/cópia.
- [ ] Streaming de mensagens *(agendado: 21/03/2026)*.

### 🏁 Fase 4: Autenticação & Produção
- [x] Firebase Auth (Login Social + Email).
- [ ] Edição de mensagens.
- [ ] Deploy v1.0 Production.

---

## 💬 Gerenciamento de Conversas (3.0)
✅ **Sidebar de Navegação**  
- Botão "Novo Chat" funcional com limpeza de estado.  
- Lista de chats com estados de hover e transições suaves.  

✅ **Interface Minimalista "Flat"**  
- Saudações dinâmicas e chips de sugestão de prompt.  
- Bolhas de chat sutis para o usuário e texto direto para IA.  

✅ **Scroll Automático & Performance**  
- Utiliza hooks customizados (`useChat`) para gerenciamento eficiente de mensagens.  

---

## 🗂️ **Status da Produção**

| Etapa | Status | Descrição |
|-------|--------|-----------|
| 🔹 Fase 1 | ✅ Concluída | Fundação monorepo, backend e redesign minimalista |
| 🔸 Fase 2 | ✅ Concluída | Firebase, auth, Google Grounding e suporte mobile completo |
| 🔺 Fase 3 | 🚧 Em andamento | Uploads, visualizadores, thoughts — streaming em 21/03 |
| 🏁 Fase 4 | 📋 Planejado | Polimento final, edição e lançamento oficial |

---

## 🧠 Sobre o Projeto  

**Flavos IA 3.0** é a evolução definitiva da plataforma, focada em escala, segurança e uma experiência de usuário premium. Modular por design, cada parte da aplicação (Web, Mobile e Backend) compartilha a mesma inteligência e sistema de design.

---

## 📦 Detalhes Técnicos

- **Core:** React 19, Expo, Node.js
- **IA:** Google Gemini 2.5-flash / gemini-3.1-flash
- **Styles:** CSS Variables + StyleSheet (RN)
- **State:** Zustand
- **Storage:** Firebase Firestore + AsyncStorage

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-orange)
![Versão](https://img.shields.io/badge/vers%C3%A3o-3.0%20v1.3-blueviolet)
![Lançamento](https://img.shields.io/badge/release-15%2F03%2F2026-success)

**📅 Última atualização:** `15/03/2026`  
**🧑‍💻 Desenvolvedor:** Kauã Jorge  
**🎨 Design:** Flavos IA Team
