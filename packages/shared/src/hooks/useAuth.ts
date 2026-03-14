// ===================================================
// Flavos IA 3.0 — useAuth Hook (Firebase Auth Real)
// ===================================================

import { create } from 'zustand';
import type { AuthState } from '../types';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import { upsertAccount } from '../services/dbService';

export const useAuth = create<AuthState>((set) => {
  // O Zustand store é criado quando o módulo é importado, o que acontece
  // ANTES de main.tsx chamar initFirebase(). Por isso, usamos queueMicrotask
  // para diferir o registro do listener ao próximo ciclo do event loop,
  // garantindo que initFirebase() já foi chamado.
  queueMicrotask(() => {
    try {
      const auth = getFirebaseAuth();
      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          // Cria/atualiza o perfil na coleção accounts (fire-and-forget)
          upsertAccount(firebaseUser.uid, {
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
          }).catch(() => {}); // silencia erros não críticos

          set({
            user: {
              id: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
            },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      });
    } catch (e) {
      // Firebase não inicializado (ex: ambiente de testes unitários)
      console.warn('[useAuth] Firebase não disponível:', e);
      set({ isLoading: false });
    }
  });

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true, // Firebase verifica sessão em background
    error: null,

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
        // onAuthStateChanged atualiza isAuthenticated automaticamente
      } catch (error: any) {
        set({ isLoading: false, error: translateFirebaseError(error.code) });
        throw error;
      }
    },

    register: async (email: string, password: string, name?: string) => {
      set({ isLoading: true, error: null });
      try {
        const { user: fbUser } = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
        // Salva o nome no perfil Firebase imediatamente após o cadastro
        if (name?.trim()) {
          await updateProfile(fbUser, { displayName: name.trim() });
        }
        // onAuthStateChanged dispara logo após e pega o displayName já atualizado
      } catch (error: any) {
        set({ isLoading: false, error: translateFirebaseError(error.code) });
        throw error;
      }
    },

    loginWithGoogle: async () => {
      set({ isLoading: true, error: null });
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(getFirebaseAuth(), provider);
      } catch (error: any) {
        set({ isLoading: false, error: translateFirebaseError(error.code) });
        throw error;
      }
    },

    // Mobile: recebe o idToken do expo-auth-session e autentica via credential
    loginWithGoogleNative: async (idToken: string) => {
      set({ isLoading: true, error: null });
      try {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(getFirebaseAuth(), credential);
        // onAuthStateChanged vai atualizar o estado automaticamente
      } catch (error: any) {
        set({ isLoading: false, error: translateFirebaseError(error.code) });
        throw error;
      }
    },

    logout: async () => {
      set({ isLoading: true });
      try {
        await signOut(getFirebaseAuth());
      } catch {
        set({ isLoading: false, error: 'Erro ao sair. Tente novamente.' });
      }
    },
  };
});

function translateFirebaseError(code: string): string {
  const errorMap: Record<string, string> = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-disabled': 'Conta desativada.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/weak-password': 'Senha fraca. Use pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
    'auth/popup-closed-by-user': 'Login cancelado.',
    'auth/network-request-failed': 'Sem conexão com a internet.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
  };
  return errorMap[code] || `Erro de autenticação (${code}).`;
}
