// ===================================================
// Flavos IA 3.0 — Database Service (Secure Firestore Schema)
// ===================================================
//
// Schema:
//   accounts/{uid}                                   → perfil e plano do usuário
//   conversations/{conversationId}                   → metadados da conversa
//   conversations/{conversationId}/entries/{entryId} → mensagens (entries)
//
// Princípios:
//   • IDs com alta entropia via crypto.randomUUID()
//   • owner sempre = Firebase UID do usuário autenticado
//   • Sidebar: APENAS metadados — nunca entries
//   • Queries: SEMPRE filtradas por owner + limit()
//   • Timestamps: SEMPRE serverTimestamp() — nunca do cliente
//   • Conversa criada ANTES das entries (permite regra de segurança com get())
//   • Entry + metadata sempre salvos em batch atômico
// ===================================================

import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { generateId } from '../utils/generateId';
import type { Entry, EntryRole, ConversationMeta, AccountProfile, Message, AttachmentMeta } from '../types';
import { getFirebaseDb } from '../config/firebase';

// ===== Helpers =====

function newId(): string {
  return generateId();
}

function db() {
  return getFirebaseDb();
}

/** Trunca texto para uso em previews da sidebar. */
function truncate(text: string, maxLen = 80): string {
  const clean = text.trim().replace(/\n+/g, ' ');
  return clean.length > maxLen ? clean.substring(0, maxLen) + '…' : clean;
}

// =====================================================
// ACCOUNTS — accounts/{uid}
// =====================================================

/**
 * Cria o perfil em accounts/{uid} na primeira vez que o usuário faz login.
 * Idempotente: não sobrescreve se já existir.
 */
export async function upsertAccount(
  uid: string,
  data: Partial<Pick<AccountProfile, 'displayName' | 'email' | 'photoURL'>>
): Promise<void> {
  const ref = doc(db(), 'accounts', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      displayName: data.displayName ?? null,
      email: data.email ?? null,
      photoURL: data.photoURL ?? null,
      plan: 'free',
      createdAt: serverTimestamp(),
      metadata: {},
    });
  }
}

// =====================================================
// CONVERSATIONS — Sidebar
// conversations/{conversationId}
// =====================================================

/**
 * Listener realtime da sidebar.
 * Carrega APENAS metadados — NUNCA entries.
 * Filtrado por owner + status=active, ordenado por updatedAt, limit(20).
 */
export function listenConversations(
  owner: string,
  onChange: (conversations: ConversationMeta[]) => void
): Unsubscribe {
  const q = query(
    collection(db(), 'conversations'),
    where('owner', '==', owner),
    where('status', '==', 'active'),
    orderBy('updatedAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snap) => {
    const conversations: ConversationMeta[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title:          data.title          ?? 'Conversa',
        lastMsgPreview: data.lastMsgPreview ?? '',
        lastMsgRole:    (data.lastMsgRole   ?? 'user') as EntryRole,
        lastMsgAt:      (data.lastMsgAt  as Timestamp)?.toMillis() ?? Date.now(),
        updatedAt:      (data.updatedAt  as Timestamp)?.toMillis() ?? Date.now(),
        status:          data.status,
      };
    });
    onChange(conversations);
  });
}

// =====================================================
// CONVERSATION CREATION
// =====================================================

/**
 * Cria o documento de metadados de uma nova conversa.
 * A conversa é criada ANTES das entries, o que permite que as regras
 * de segurança do Firestore verifiquem o ownership via get() antes
 * de permitir escritas na sub-coleção.
 *
 * @returns ID da conversa criada (crypto.randomUUID())
 */
export async function createConversation(
  owner: string,
  firstMessage: string
): Promise<string> {
  const conversationId = newId();
  const ref = doc(db(), 'conversations', conversationId);

  await setDoc(ref, {
    owner,
    title:          truncate(firstMessage, 40),
    lastMsgPreview: '',
    lastMsgRole:    'user' as EntryRole,
    lastMsgAt:      serverTimestamp(),
    createdAt:      serverTimestamp(),
    updatedAt:      serverTimestamp(),
    status:         'active' as const,
    visibility:     'private' as const,
  });

  return conversationId;
}

// =====================================================
// ENTRIES — Mensagens
// conversations/{conversationId}/entries/{entryId}
// =====================================================

/**
 * Listener realtime das entries de um chat aberto.
 * Ordenadas por createdAt ASC, limitadas a 100 para proteger contra chats gigantes.
 */
export function listenEntries(
  conversationId: string,
  onChange: (messages: Message[]) => void
): Unsubscribe {
  const q = query(
    collection(db(), 'conversations', conversationId, 'entries'),
    orderBy('createdAt', 'asc'),
    limit(100)
  );

  return onSnapshot(q, (snap) => {
    const messages: Message[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id:              d.id,
        role:            data.role,
        content:         data.body,
        timestamp:       (data.createdAt as Timestamp)?.toMillis() ?? Date.now(),
        // Metadados leves de arquivo — nunca base64
        ...(data.attachmentsMeta?.length && { attachmentsMeta: data.attachmentsMeta as AttachmentMeta[] }),
      };
    });
    onChange(messages);
  });
}

/**
 * ⚡ ATÔMICO: Salva uma entry + atualiza metadados da conversa em batch.
 *
 * Operações:
 *   1. batch.set(entryRef)    → nova mensagem (role, sender, body, createdAt)
 *   2. batch.update(convRef)  → lastMsgPreview, lastMsgRole, lastMsgAt, updatedAt
 *
 * @returns ID da entry criada
 */
export async function saveEntryAndUpdateMeta(
  conversationId: string,
  entry: { role: Entry['role']; sender: Entry['sender']; body: string; attachmentsMeta?: AttachmentMeta[] }
): Promise<string> {
  const entryId = newId();
  const entryRef = doc(db(), 'conversations', conversationId, 'entries', entryId);
  const convRef  = doc(db(), 'conversations', conversationId);

  const batch = writeBatch(db());

  // 1. Nova entry
  batch.set(entryRef, {
    role:      entry.role,
    sender:    entry.sender,
    body:      entry.body,
    createdAt: serverTimestamp(),
    // Salva apenas metadados leves — NUNCA o base64
    ...(entry.attachmentsMeta?.length && { attachmentsMeta: entry.attachmentsMeta }),
  });

  // 2. Atualiza APENAS os campos de metadata necessários para a sidebar
  batch.update(convRef, {
    lastMsgPreview: truncate(entry.body),
    lastMsgRole:    entry.role,
    lastMsgAt:      serverTimestamp(),
    updatedAt:      serverTimestamp(),
  });

  await batch.commit();
  return entryId;
}

// =====================================================
// SOFT DELETE
// =====================================================

/**
 * Arquiva uma conversa (status → 'deleted'). Nunca apaga fisicamente.
 */
export async function archiveConversation(conversationId: string): Promise<void> {
  const ref = doc(db(), 'conversations', conversationId);
  await setDoc(ref, { status: 'deleted', updatedAt: serverTimestamp() }, { merge: true });
}
