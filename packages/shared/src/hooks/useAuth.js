// ===================================================
// Flavos IA 3.0 — useAuth Hook (Placeholder)
// TODO: Firebase — Substituir por integração real com Firebase Auth
// ===================================================
import { create } from 'zustand';
/**
 * Mock do usuário para desenvolvimento sem autenticação.
 * TODO: Firebase — Remover quando integrar Firebase Auth.
 */
const MOCK_USER = {
    id: 'mock-user-001',
    displayName: 'Usuário Flavos',
    email: 'user@flavos.dev',
    photoURL: null,
};
/**
 * Store de autenticação (placeholder).
 * TODO: Firebase — Conectar ao onAuthStateChanged do Firebase.
 * TODO: Firebase — Implementar signInWithEmailAndPassword, createUserWithEmailAndPassword.
 * TODO: Firebase — Implementar signInWithPopup para Google/GitHub OAuth.
 */
export const useAuth = create((set) => ({
    user: MOCK_USER,
    isAuthenticated: true, // TODO: Firebase — Começa como false
    isLoading: false,
    error: null,
    /**
     * Mock login.
     * TODO: Firebase — Substituir por signInWithEmailAndPassword(auth, email, password)
     */
    login: async (_email, _password) => {
        set({ isLoading: true, error: null });
        // Simula delay de autenticação
        await new Promise((resolve) => setTimeout(resolve, 500));
        // TODO: Firebase — Substituir por chamada real
        set({
            user: MOCK_USER,
            isAuthenticated: true,
            isLoading: false,
        });
    },
    /**
     * Mock logout.
     * TODO: Firebase — Substituir por signOut(auth)
     */
    logout: async () => {
        set({ isLoading: true });
        // TODO: Firebase — Substituir por chamada real
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        });
    },
}));
//# sourceMappingURL=useAuth.js.map