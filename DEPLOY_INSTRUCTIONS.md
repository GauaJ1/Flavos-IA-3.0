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
# Se tiver Nginx + SSL: https://flavosia-api.duckdns.org
# Se for acesso direto por IP (LEGADO - NÃO USAR MAIS): http://159.112.180.28:3001
VITE_API_URL=https://flavosia-api.duckdns.org

# Firebase Web SDK (usado pelo middleware de autenticação do backend)
FIREBASE CONFIG

FIREBASE_PROJECT_ID=flavos-ia-3
```

### ⚙️ Variáveis opcionais para a Lixeira Automática (Cron Job):
> Somente necessárias se for ativar o `/api/admin/cleanup-trash`.
> Gere a chave de serviço em: **Firebase Console → Configurações do Projeto → Contas de Serviço → Gerar nova chave privada**.
```env
CLEANUP_SECRET=AQUI"
```

---

## 2. Automação da Lixeira (Opcional em Prod)

O banco de dados de um serviço de chat pode crescer muito com conversas deletadas. A limpeza precisa ser feita diariamente e automaticamente por um **Cron Job**.

**Como configurar via [cron-job.org](https://cron-job.org/en/) (Grátis):**

1. Crie uma conta no site cron-job.org ou faça login.
2. Clique em **"Create Cronjob"**.
3. **URL**: Preencha com a URL atual do backend (DuckDNS + SSL):
   - `https://flavosia-api.duckdns.org/api/admin/cleanup-trash`
   - ⚠️ **IMPORTANTE:** A URL antiga `http://159.112.180.28:3001/...` está desatualizada. Se você já tem um cron configurado com ela, acesse o painel do cron-job.org, edite o job existente e troque a URL.
4. Na parte de cronograma (Execution Schedule), selecione "User-defined" e peça para rodar **a cada 24 horas** ou diariamente de madrugada (Ex: 03:00).
5. Em **Advanced**:
   - **HTTP method:** Troque para `POST`
   - **HTTP Headers:** Adicione uma nova linha:
     - Header Name: `Authorization`
     - Header Value: `Bearer x`
6. Salve o Cron Job no botão verde (`Create`).

**Para verificar se o cron está funcionando:**  
Após salvar, clique em "Test run" no cron-job.org. A resposta deve ser `200 OK` com body `{"status":"success"}`.
Se retornar `503`: o `CLEANUP_SECRET` não está setado na VPS.  
Se retornar `403`: o token no header está errado.
