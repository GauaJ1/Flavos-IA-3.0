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
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  deleteField,
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
        pinned:          data.pinned ?? false,
      };
    });
    onChange(conversations);
  });
}

/**
 * Listener realtime da lixeira.
 * Apenas conversas com status='trash', ordenadas por trashedAt desc.
 */
export function listenTrashedConversations(
  owner: string,
  onChange: (conversations: ConversationMeta[]) => void
): Unsubscribe {
  const q = query(
    collection(db(), 'conversations'),
    where('owner', '==', owner),
    where('status', '==', 'trash'),
    orderBy('trashedAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snap) => {
    const conversations: ConversationMeta[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id:             d.id,
        title:          data.title          ?? 'Conversa',
        lastMsgPreview: data.lastMsgPreview ?? '',
        lastMsgRole:    (data.lastMsgRole   ?? 'user') as EntryRole,
        lastMsgAt:      (data.lastMsgAt  as Timestamp)?.toMillis()  ?? Date.now(),
        updatedAt:      (data.updatedAt  as Timestamp)?.toMillis()  ?? Date.now(),
        trashedAt:      (data.trashedAt  as Timestamp)?.toMillis()  ?? Date.now(),
        status:         data.status,
        pinned:         data.pinned ?? false,
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

/**
 * Alterna o estado de fixado (pinned) de uma conversa.
 * Pinned conversations aparecem no topo da sidebar.
 */
export async function pinConversation(
  conversationId: string,
  pinned: boolean
): Promise<void> {
  const ref = doc(db(), 'conversations', conversationId);
  await import('firebase/firestore').then(({ updateDoc }) =>
    updateDoc(ref, { pinned })
  );
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
    const messages: Message[] = snap.docs
      .filter((d) => !d.data().superseded)   // ignora entries soft-deleted
      .map((d) => {
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
// TRASH — Sistema de Lixeira
// =====================================================

/**
 * Move uma conversa para a lixeira.
 * Não apaga fisicamente — define status='trash' e registra trashedAt.
 * A conversa desaparece da sidebar principal e aparece na lixeira.
 * Expira automaticamente após 4 dias via job backend.
 */
export async function trashConversation(conversationId: string): Promise<void> {
  const ref = doc(db(), 'conversations', conversationId);
  await setDoc(ref, {
    status: 'trash',
    trashedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Restaura uma conversa da lixeira para 'active'.
 * Remove trashedAt com deleteField() para limpar o campo do Firestore.
 */
export async function restoreConversation(conversationId: string): Promise<void> {
  const ref = doc(db(), 'conversations', conversationId);
  await updateDoc(ref, {
    status: 'active',
    trashedAt: deleteField(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Hard delete: apaga fisicamente o documento da conversa.
 *
 * IMPORTANTE (segurança defensiva):
 *   - Só funciona se a conversa já estiver com status='trash' (regra do Firestore).
 *   - As entries da sub-coleção ficam como órfãs temporárias — NUNCA
 *     tente lê-las sem antes verificar que o doc da conversa existe.
 *   - O job backend (POST /api/admin/cleanup-trash) é responsável por
 *     limpar as entries órfãs em segundo plano.
 */
export async function hardDeleteConversation(conversationId: string): Promise<void> {
  const ref = doc(db(), 'conversations', conversationId);
  await deleteDoc(ref);
}

/** @deprecated Use trashConversation */
export { trashConversation as archiveConversation };
/** @deprecated Use trashConversation */
export { trashConversation as deleteConversation };

// =====================================================
// EDIÇÃO DE MENSAGEM — supersedEntriesFrom
// =====================================================

/**
 * Marca como `superseded: true` todas as entries de uma conversa
 * cujo timestamp (createdAt) seja >= fromTimestamp.
 *
 * Isso implementa o "soft-delete de entries" que permite editar mensagens:
 *   1. Marca a entry editada e todas as posteriores como superseded.
 *   2. O listener ignora entries superseded.
 *   3. Novas entries (usuário + IA regenerada) são criadas normalmente.
 *
 * Segurança: a Firestore Rule só permite superseded → true (nunca false).
 */
export async function supersedEntriesFrom(
  conversationId: string,
  fromTimestamp: number
): Promise<void> {
  // Busca entries a partir do timestamp (inclusive)
  const q = query(
    collection(db(), 'conversations', conversationId, 'entries'),
    where('createdAt', '>=', Timestamp.fromMillis(fromTimestamp)),
    orderBy('createdAt', 'asc'),
    limit(100)  // Segurança: nunca processa mais que 100 entries de uma vez
  );

  const snap = await getDocs(q);
  if (snap.empty) return;

  // Processa em lotes de 500 (limite do Firestore writeBatch)
  const chunks: typeof snap.docs[] = [];
  for (let i = 0; i < snap.docs.length; i += 500) {
    chunks.push(snap.docs.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db());
    for (const d of chunk) {
      // Só marca se ainda não estiver superseded (idempotente)
      if (!d.data().superseded) {
        batch.update(d.ref, { superseded: true });
      }
    }
    await batch.commit();
  }
}
