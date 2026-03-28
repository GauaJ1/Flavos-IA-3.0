// ===================================================
// Flavos IA 3.0 — AI Service (Frontend → Backend Proxy)
// Cross-platform SSE streaming via XHR (works on web + React Native/Hermes).
// ===================================================

import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import type { ChatRequest, ChatResponse, Message, MediaAttachment, GroundingSource, GroundingSupport } from '../types';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export interface StreamingCallbacks {
  onText: (text: string) => void;
  onThought: (thought: string) => void;
  onGrounding: (sources: GroundingSource[], supports: GroundingSupport[]) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

export type AiErrorType = 'rate_limit' | 'network' | 'stream' | 'backend' | 'unknown';

/** Erro enriquecido com tipo semântico e retryAfter para a UI. */
export class AiError extends Error {
  constructor(
    message: string,
    public readonly errorType: AiErrorType = 'unknown',
    public readonly retryAfter: number | null = null,
  ) {
    super(message);
    this.name = 'AiError';
  }
}

/** Converte status HTTP em AiError com mensagem amigável. */
function httpStatusToError(status: number, retryAfterHeader?: string | null): AiError {
  if (status === 429) {
    const secs = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
    const wait = (secs && !isNaN(secs)) ? ` Aguarde ${secs}s.` : ' Aguarde alguns instantes.';
    return new AiError(
      `Muitas solicitações em pouco tempo.${wait} Tente novamente em breve.`,
      'rate_limit',
      (secs && !isNaN(secs)) ? secs : 30,
    );
  }
  if (status === 401 || status === 403) {
    return new AiError('Sessão expirada ou sem permissão. Faça login novamente.', 'backend');
  }
  if (status >= 500) {
    return new AiError(
      'O servidor da IA encontrou um problema interno. Tente novamente em alguns instantes.',
      'backend',
    );
  }
  return new AiError(`Erro inesperado (HTTP ${status}). Tente novamente.`, 'unknown');
}


// ─────────────────────────────────────────────────
// Helper: Firebase token header
// ─────────────────────────────────────────────────

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { getAuth } = await import('firebase/auth');
    const { getApp } = await import('firebase/app');
    const currentUser = getAuth(getApp()).currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Firebase not initialized (dev / test)
  }
  return {};
}

// ─────────────────────────────────────────────────
// SSE buffer parser helper
// ─────────────────────────────────────────────────

function processSSEBuffer(
  buffer: string,
  callbacks: StreamingCallbacks,
): { remaining: string; done: boolean } {
  const events = buffer.split('\n\n');
  const remaining = events.pop() ?? ''; // keep incomplete fragment

  for (const event of events) {
    const line = event.trim();
    if (!line.startsWith('data:')) continue;

    const payload = line.slice(5).trim();
    if (payload === '[DONE]') return { remaining, done: true };

    try {
      const parsed = JSON.parse(payload);
      if (parsed.text)      callbacks.onText(parsed.text);
      if (parsed.thought)   callbacks.onThought(parsed.thought);
      if (parsed.grounding) callbacks.onGrounding(parsed.grounding.sources ?? [], parsed.grounding.supports ?? []);
      if (parsed.error) {
        const errVal: string = parsed.error;
        if (errVal.startsWith('__rate_limit__')) {
          const secs = parseInt(errVal.split(':')[1] ?? '30', 10);
          callbacks.onError(new AiError(
            `Muitas solicitações em pouco tempo. Aguarde ${secs}s e tente novamente.`,
            'rate_limit',
            secs,
          ));
        } else {
          callbacks.onError(new AiError(errVal, 'unknown'));
        }
      }
    } catch {
      // Malformed JSON chunk — skip silently
    }
  }

  return { remaining, done: false };
}

// ─────────────────────────────────────────────────
// XHR-based streaming (works on web + React Native)
// ─────────────────────────────────────────────────

function streamWithXHR(
  url: string,
  body: string,
  headers: Record<string, string>,
  callbacks: StreamingCallbacks,
): AbortController {
  const controller = new AbortController();
  const xhr = new XMLHttpRequest();
  let processedLength = 0;
  let buffer = '';
  let done = false;

  xhr.open('POST', url, true);
  Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

  xhr.onprogress = () => {
    if (done) return;
    const newData = xhr.responseText.slice(processedLength);
    processedLength = xhr.responseText.length;
    buffer += newData;

    const result = processSSEBuffer(buffer, callbacks);
    buffer = result.remaining;
    if (result.done) {
      done = true;
      callbacks.onDone();
    }
  };

  xhr.onload = () => {
    if (done) return;
    // Process any leftover buffer at the end
    if (buffer.trim()) {
      const result = processSSEBuffer(buffer + '\n\n', callbacks);
      buffer = result.remaining;
    }
    if (!done) {
      done = true;
      callbacks.onDone();
    }
  };

  xhr.onerror = () => {
    if (!done) {
      done = true;
      callbacks.onError(new AiError(
        'Erro de rede ao conectar com o backend. Verifique sua conexão.',
        'network',
      ));
    }
  };

  xhr.onabort = () => { /* silently cancelled — user triggered stopGeneration */ };

  // Intercept non-2xx HTTP status BEFORE onload treats the body as SSE
  xhr.addEventListener('readystatechange', () => {
    if (xhr.readyState === 4 && !done && (xhr.status < 200 || xhr.status >= 300)) {
      done = true;
      callbacks.onError(httpStatusToError(xhr.status, xhr.getResponseHeader('retry-after')));
    }
  });

  // Abort via AbortController signal
  controller.signal.addEventListener('abort', () => xhr.abort());


  xhr.send(body);
  return controller;
}

// ─────────────────────────────────────────────────
// AIService class
// ─────────────────────────────────────────────────

class AIService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Streams a response using XHR + onprogress — works on both web and React Native (Hermes).
   * @returns AbortController — call .abort() to cancel mid-stream.
   */
  generateResponseStream(
    messages: Pick<Message, 'role' | 'content'>[],
    userName?: string,
    attachments?: MediaAttachment[],
    callbacks?: StreamingCallbacks,
  ): AbortController {
    const url = `${this.baseUrl}${API_ENDPOINTS.CHAT_GENERATE}`;
    const cb = callbacks ?? {
      onText: () => {},
      onThought: () => {},
      onGrounding: () => {},
      onDone: () => {},
      onError: () => {},
    };
    const body = JSON.stringify({ messages, userName, attachments } as ChatRequest);

    // Start async — get auth header then begin XHR stream
    const controller = new AbortController();
    let xhrController: AbortController | null = null;

    (async () => {
      try {
        const authHeader = await getAuthHeader();
        if (controller.signal.aborted) return;

        xhrController = streamWithXHR(
          url,
          body,
          { 'Content-Type': 'application/json', ...authHeader },
          cb,
        );

        // Forward abort to inner XHR controller
        controller.signal.addEventListener('abort', () => xhrController?.abort());
      } catch (err: any) {
        cb.onError(err instanceof Error ? err : new Error(String(err)));
      }
    })();

    return controller;
  }

  /**
   * Non-streaming compat wrapper — accumulates the full stream and resolves as a ChatResponse.
   * @deprecated Prefer generateResponseStream for new code.
   */
  async generateResponse(
    messages: Pick<Message, 'role' | 'content'>[],
    userName?: string,
    attachments?: MediaAttachment[],
  ): Promise<ChatResponse> {
    return new Promise((resolve, reject) => {
      let fullText = '';
      let thoughts = '';
      let sources: GroundingSource[] = [];
      let supports: GroundingSupport[] = [];

      this.generateResponseStream(messages, userName, attachments, {
        onText:      (t) => { fullText += t; },
        onThought:   (t) => { thoughts += t; },
        onGrounding: (s, sp) => { sources = s; supports = sp; },
        onDone:      () => resolve({
          content: fullText || 'Desculpe, não consegui gerar uma resposta.',
          model: 'streaming',
          ...(sources.length  && { sources }),
          ...(supports.length && { supports }),
          ...(thoughts        && { thoughts }),
        }),
        onError: reject,
      });
    });
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
}

// Singleton
export const aiService = new AIService();
export { AIService };
