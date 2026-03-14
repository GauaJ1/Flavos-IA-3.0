// ===================================================
// Flavos IA 3.0 — Firebase Registry (Shared Package)
// ===================================================
// O shared package não acessa import.meta.env diretamente.
// O app host (ex: @flavos/web) chama initFirebase(config) para registrar as
// instâncias de auth e db que o shared package vai usar.
// ===================================================

import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

let _auth: Auth | null = null;
let _db: Firestore | null = null;

/**
 * Inicializa as instâncias de Auth e Firestore.
 * Deve ser chamado antes de usar useAuth ou dbService.
 */
export function initFirebase(auth: Auth, db: Firestore): void {
  _auth = auth;
  _db = db;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) throw new Error('[Flavos] Firebase não foi inicializado. Chame initFirebase() primeiro.');
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) throw new Error('[Flavos] Firebase não foi inicializado. Chame initFirebase() primeiro.');
  return _db;
}
