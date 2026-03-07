// ===================================================
// Flavos IA 3.0 — Web App Root
// ===================================================

import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTheme } from '@flavos/shared';
import Home from './pages/Home';
import Chat from './pages/Chat';

const App: React.FC = () => {
  const { mode } = useTheme();

  // Aplica o tema no atributo data-theme do body
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
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </div>
  );
};

export default App;
