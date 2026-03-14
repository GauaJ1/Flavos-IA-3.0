// ===================================================
// Flavos IA 3.0 — Web App Root (com Route Protection)
// ===================================================

import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTheme, useAuth } from '@flavos/shared';
import Home from './pages/Home';
import Chat from './pages/Chat';

/**
 * Rota protegida: redireciona para "/" se o usuário não estiver autenticado.
 * Enquanto o Firebase verifica a sessão (isLoading = true), mostra um loader.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg)',
          color: 'var(--text-sec)',
          fontFamily: 'Outfit, sans-serif',
          fontSize: '1rem',
          gap: 12,
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 28, opacity: 0.5 }}>
          autorenew
        </span>
        Verificando sessão...
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  const { mode } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Routes>
        {/* Se já estiver logado, redireciona Home -> /chat */}
        <Route
          path="/"
          element={
            !isLoading && isAuthenticated ? <Navigate to="/chat" replace /> : <Home />
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
