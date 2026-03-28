# Guia de Deploy e Automação — Flavos IA 3.0

Este arquivo guarda lembretes importantes para quando a aplicação for enviada para produção (Vercel, Railway, Render, etc.).

---

## 1. Configuração de Variáveis de Ambiente (Hospedagem Backend)

No seu serviço de hospedagem do Backend (Ex: **Railway** ou **Render**), não esqueça de configurar as seguintes variáveis:

- As credenciais do Firebase (para evitar os acessos de dev expostos).
- O `CLEANUP_SECRET`: 
  ```env
  CLEANUP_SECRET=3d5e054140e73bd1ccb2fddb195d07d4adc4a26137dcaefefa36e5ecde10bc56
  ```
> **Nota de Dev:** Essa chave é a mesma que você gerou localmente. Em produção, você pode gerar uma nova se preferir (rodando `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`), só lembre de atualizar nos dois lados!

---

## 2. Automação da Lixeira (Obrigatório em Prod)

O banco de dados de um serviço de chat pode crescer muito com conversas deletadas. A limpeza precisa ser feita diariamente e automaticamente por um **Cron Job**. 

**Como configurar via [cron-job.org](https://cron-job.org/en/) (Grátis):**

1. Crie uma conta no site cron-job.org ou faça login.
2. Clique em **"Create Cronjob"**.
3. **URL**: Preencha com a rota inteira em produção do backend da limpeza:
   - *Exemplo:* `https://seu-backend-flavos.up.railway.app/api/admin/cleanup-trash`
4. Na parte de cronograma (Execution Schedule), selecione "User-defined" e peça para rodar **a cada 24 horas** ou diariamente de madrugada (Ex: 03:00).
5. Em **Advanced**:
   - **HTTP method:** Troque para `POST`
   - **HTTP Headers:** Adicione uma nova linha:
     - Header Name: `Authorization`
     - Header Value: `Bearer 3d5e054140e73bd1ccb2fddb195d07d4adc4a26137dcaefefa36e5ecde10bc56`
6. Salve o Cron Job no botão verde (`Create`).

Pronto. Ele fará o post e o backend vai limpar os documentos (max 100/dia, que estavam em 'trash' há mais de 4 dias), cuidando da saúde e tamanho do database automaticamente.
