# Firebase App Check — Preparação Técnica

## O que é

O App Check protege seu backend de chamadas não autorizadas ao verificar que a requisição vem de **uma instância legítima das suas apps**. Combinado com Firebase Auth (que verifica *quem* é o usuário), o App Check verifica *de onde* a chamada vem.

Sem App Check, qualquer pessoa com a URL do backend pode chamar `/api/chat/generate` com um token válido.

---

## Por que adiar para pós-lançamento

Os dois provedores de hardware confiáveis requerem apps publicadas:

- **Play Integrity** (Android) → exige app na Play Store (mesmo internal track)
- **App Attest** (iOS) → exige app assinada com distribuição TestFlight ou App Store

Durante o desenvolvimento, é possível usar o **Debug Provider**, mas ele não oferece proteção real.

---

## Provedores por plataforma

| Plataforma | Provedor recomendado | Alternativa |
|---|---|---|
| Web | reCAPTCHA Enterprise | reCAPTCHA v3 (mais simples) |
| Android | Play Integrity | |
| iOS | App Attest | DeviceCheck (legado) |

---

## Como integrar no backend (quando chegar a hora)

### 1. Instalar firebase-admin

```bash
npm install firebase-admin   # packages/backend
```

### 2. Inicializar com Service Account

```ts
import { initializeApp } from 'firebase-admin/app';
import { getAppCheck } from 'firebase-admin/app-check';

initializeApp({
  credential: cert(serviceAccountJson), // ou Application Default Credentials
  projectId: 'flavos-ia-3',
});
```

### 3. Middleware de verificação

Adicionar **antes** de `requireAuth` nas rotas críticas:

```ts
export async function requireAppCheck(req, res, next) {
  const appCheckToken = req.headers['x-firebase-appcheck'];
  if (!appCheckToken || typeof appCheckToken !== 'string') {
    return res.status(401).json({ error: 'App Check token ausente.' });
  }
  try {
    await getAppCheck().verifyToken(appCheckToken);
    next();
  } catch {
    res.status(401).json({ error: 'App Check token inválido.' });
  }
}
```

### 4. Ordem dos middlewares

```ts
router.post('/generate', requireAppCheck, requireAuth, uidLimiter, handler);
```

---

## Frontend — enviar o token

### Web (reCAPTCHA Enterprise)

```ts
import { getToken } from 'firebase/app-check';
import { appCheck } from './firebase'; // instância do App Check

const { token } = await getToken(appCheck, /* forceRefresh */ false);
headers['X-Firebase-AppCheck'] = token;
```

### React Native (Expo)

Usar `@react-native-firebase/app-check` ou aguardar suporte nativo do Expo.

---

## Cronograma sugerido

1. **Agora (Beta)**: Rate limit + Auth JWT protegem adequadamente.
2. **Ao publicar na Play Store / App Store**: Habilitar Play Integrity + App Attest.
3. **Web em produção**: Configurar reCAPTCHA Enterprise e habilitar App Check na console do Firebase.
4. **Enforcement total**: Marcar App Check como obrigatório no Firebase Console — isso bloqueia qualquer chamada sem token válido, mesmo de Postman / curl.

---

## Enforcement gradual (recomendado)

No Firebase Console → App Check → defina modo **Monitor** primeiro (não bloqueia, só registra métricas). Após confirmar que suas apps estão enviando tokens corretamente, mude para **Enforce**.
