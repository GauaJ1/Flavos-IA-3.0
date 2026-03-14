// ===================================================
// Flavos IA 3.0 — Chat Page (Gemini-like Minimalist)
// ===================================================

import React, { useRef, useEffect } from 'react';
import { useChat, useTheme, Sidebar, MessageList, ChatInput, useSidebar, useAuth } from '@flavos/shared';

const Chat: React.FC = () => {
  const { messages, isLoading, error, sendMessage, clearMessages, clearError } = useChat();
  const { theme } = useTheme();
  const { isPinned } = useSidebar();
  const { user } = useAuth();
  const SIDEBAR_W = 268;

  const showGreeting = messages.length === 0 && !isLoading;

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      <Sidebar />

      {/* Main Chat Area — desloca para direita quando sidebar está fixada */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          height: '100%',
          marginLeft: isPinned ? SIDEBAR_W : 0,
          transition: 'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Error banner (absoluto no topo) */}
        {error && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 20px',
              background: 'rgba(214, 41, 57, 0.15)', // --error com opacidade
              borderBottom: '1px solid rgba(214, 41, 57, 0.3)',
              color: theme.colors.error,
              fontSize: '13px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>error</span>
              {error}
            </span>
            <button
              onClick={clearError}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.error,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
            </button>
          </div>
        )}

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {showGreeting ? (
            <div
              className="fade-in"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                maxWidth: 980,
                margin: '0 auto',
                padding: '0 20px',
                marginTop: '-10vh', // Deslocar visualmente pra cima
              }}
            >
              <h1
                style={{
                  fontSize: '3rem',
                  fontWeight: 600,
                  background: 'linear-gradient(to right, #66ff4b, #ff5546)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: 8,
                }}
              >
                Olá{user?.displayName ? `, ${user.displayName.split(' ').slice(0, 2).join(' ')}` : ''}!
              </h1>
              <h2
                style={{
                  fontSize: '2.6rem',
                  color: 'var(--text-sec)',
                  fontWeight: 400,
                }}
              >
                Como posso te ajudar?
              </h2>

              {/* Sugestões (Opcional - da base CSS) */}
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  marginTop: 60,
                  overflowX: 'auto',
                  paddingBottom: 20,
                  scrollbarWidth: 'none',
                }}
              >
                {[
                  { text: 'Resumo das novidades em React 19', icon: 'lightbulb' },
                  { text: 'Me explique buracos negros', icon: 'explore' },
                  { text: 'Projete um layout de Dashboard', icon: 'code' },
                ].map((sug, i) => (
                  <div
                    key={i}
                    onClick={() => sendMessage(sug.text)}
                    style={{
                      width: 228,
                      padding: 18,
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      borderRadius: 12,
                      background: 'var(--surface-variant)',
                      cursor: 'pointer',
                      transition: 'background 0.3s',
                      minHeight: 140,
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--border)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'var(--surface-variant)')}
                  >
                    <p style={{ width: '100%', fontSize: '1.1rem', color: 'var(--text)' }}>
                      {sug.text}
                    </p>
                    <span
                      className="material-symbols-rounded"
                      style={{
                        width: 45,
                        height: 45,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        background: 'var(--bg)',
                        color: ['#1d7efd', '#28a745', '#ffc107', '#6f42c1'][i % 4],
                        marginTop: 'auto',
                      }}
                    >
                      {sug.icon}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ paddingBottom: 100 }}>
              <MessageList
                messages={messages}
                isLoading={isLoading}
                style={{
                  container: { background: 'transparent' },
                }}
              />
            </div>
          )}
        </div>

        {/* Input area fica fixa na base da main */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(180deg, transparent, var(--bg) 20%)',
            paddingTop: 30, // Gradiente suave sobrepondo a lista
          }}
        >
          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default Chat;
