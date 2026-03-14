// ===================================================
// Flavos IA 3.0 — Sidebar Component
// ===================================================

import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  onNewChat: () => void;
  /** Platform-specific styles */
  style?: React.CSSProperties;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewChat, style }) => {
  const { mode, toggleTheme, theme } = useTheme();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const colors = theme.colors;

  return (
    <>
      {/* Botão de Toggle flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: 16,
          left: isOpen ? 276 : 16,
          zIndex: 300,
          background: isOpen ? colors.surfaceVariant : 'none',
          border: 'none',
          color: colors.text,
          cursor: 'pointer',
          padding: 8,
          borderRadius: 8,
          transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label={isOpen ? 'Recolher Menu' : 'Abrir Menu'}
      >
        <span
          className="material-symbols-rounded"
          style={{
            transition: 'transform 0.35s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'block',
          }}
        >
          {isOpen ? 'close' : 'menu'}
        </span>
      </button>

      {/* Overlay escuro (clicável para fechar) */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          zIndex: 190,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Sidebar Container */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100%',
          width: 260,
          background: colors.surfaceVariant,
          borderRight: `1px solid ${colors.border}`,
          padding: '20px 15px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 200,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '4px 0 24px rgba(0,0,0,0.25)' : 'none',
          ...style,
        }}
      >
        {/* Espaço para o botão de toggle não sobrepor conteúdo */}
        <div style={{ height: 48, marginBottom: 8 }} />

        {/* Novo Chat */}
        <button
          onClick={() => {
            onNewChat();
            setIsOpen(false);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: colors.background,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            padding: '12px 16px',
            borderRadius: 12,
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'background 0.2s, box-shadow 0.2s',
            marginBottom: 24,
            width: '100%',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary ?? '#1d7efd'}33`;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span className="material-symbols-rounded">add</span>
          <span>Novo Chat</span>
        </button>

        <h3
          style={{
            fontSize: 12,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 12,
            paddingLeft: 8,
          }}
        >
          Seus Chats (Mock)
        </h3>

        {/* Lista de chats (Mocking Firebase) */}
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {['Ideias de Receitas', 'Debugação de Código', 'Plano de Estudos'].map((title, i) => (
            <li
              key={i}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                color: colors.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 0.2s',
                marginBottom: 4,
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = colors.background)}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: 18, color: colors.textSecondary }}
              >
                chat_bubble
              </span>
              <span
                style={{
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </span>
            </li>
          ))}
        </ul>

        {/* Bottom Actions */}
        <div
          style={{
            marginTop: 'auto',
            borderTop: `1px solid ${colors.border}`,
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'none',
              border: 'none',
              color: colors.text,
              padding: '10px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = colors.background)}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="material-symbols-rounded">
              {mode === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            <span>{mode === 'dark' ? 'Tema Claro' : 'Tema Escuro'}</span>
          </button>

          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'none',
              border: 'none',
              color: colors.error,
              padding: '10px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = colors.background)}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="material-symbols-rounded">logout</span>
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};
