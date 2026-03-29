# Guia de Deploy e Automação — Flavos IA 3.0

Este arquivo guarda lembretes importantes para quando a aplicação for enviada para produção.

---

## 1. Arquivo `.env` na VPS (OBRIGATÓRIO)

O `.env` está no `.gitignore` e **não vai para o Git**. Você precisa criá-lo manualmente na VPS via SSH.

### Passo a passo:
```bash
# Conecte na VPS via SSH e vá para a raiz do projeto clonado
nano .env
```

### ✅ Variáveis obrigatórias para o Chat funcionar (copie e preencha):
```env
GEMINI_API_KEY=SUA_CHAVE_GEMINI_AQUI
GEMINI_MODEL=gemini-2.5-flash
PORT=3001

# URL pública da VPS — o frontend vai chamar este endereço
# Se tiver Nginx + SSL: https://api.seudominio.com
# Se for acesso direto por IP:  http://159.112.180.28:3001
VITE_API_URL=http://159.112.180.28:3001

# Firebase Web SDK (usado pelo middleware de autenticação do backend)
VITE_FIREBASE_API_KEY=AIzaSyCK1WXB11sIpmZbOmQ3utYs12MmcnD31-A
VITE_FIREBASE_AUTH_DOMAIN=flavos-ia-3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=flavos-ia-3
VITE_FIREBASE_STORAGE_BUCKET=flavos-ia-3.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=949324915747
VITE_FIREBASE_APP_ID=1:949324915747:web:188cab49f769d8e8ff7d96

FIREBASE_PROJECT_ID=flavos-ia-3
```

### ⚙️ Variáveis opcionais para a Lixeira Automática (Cron Job):
> Somente necessárias se for ativar o `/api/admin/cleanup-trash`.
> Gere a chave de serviço em: **Firebase Console → Configurações do Projeto → Contas de Serviço → Gerar nova chave privada**.
```env
CLEANUP_SECRET=3d5e054140e73bd1ccb2fddb195d07d4adc4a26137dcaefefa36e5ecde10bc56
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@flavos-ia-3.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 2. Automação da Lixeira (Opcional em Prod)

O banco de dados de um serviço de chat pode crescer muito com conversas deletadas. A limpeza precisa ser feita diariamente e automaticamente por um **Cron Job**.

**Como configurar via [cron-job.org](https://cron-job.org/en/) (Grátis):**

1. Crie uma conta no site cron-job.org ou faça login.
2. Clique em **"Create Cronjob"**.
3. **URL**: Preencha com a rota de produção do backend:
   - *Exemplo:* `https://seu-backend.com/api/admin/cleanup-trash`
4. Na parte de cronograma (Execution Schedule), selecione "User-defined" e peça para rodar **a cada 24 horas** ou diariamente de madrugada (Ex: 03:00).
5. Em **Advanced**:
   - **HTTP method:** Troque para `POST`
   - **HTTP Headers:** Adicione uma nova linha:
     - Header Name: `Authorization`
     - Header Value: `Bearer 3d5e054140e73bd1ccb2fddb195d07d4adc4a26137dcaefefa36e5ecde10bc56`
6. Salve o Cron Job no botão verde (`Create`).

Pronto. Ele fará o post e o backend vai limpar os documentos (max 100/dia, que estavam em 'trash' há mais de 4 dias), cuidando da saúde e tamanho do database automaticamente.
