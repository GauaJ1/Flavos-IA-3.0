// ===================================================
// Flavos IA 3.0 — Chat Page (Gemini-like Minimalist)
// ===================================================

import React, { useRef, useEffect } from 'react';
import { useChat, useTheme, Sidebar, MessageList, ChatInput, useSidebar, useAuth } from '@flavos/shared';
import { ErrorBanner } from '../components/ErrorBanner';

const Chat: React.FC = () => {
  const { messages, isLoading, error, errorType, retryAfter, sendMessage, editMessage, stopGeneration, clearMessages, clearError, isTyping, currentConversationId } = useChat();
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
        {/* ── Premium Error Banner ── */}
        {error && (
          <ErrorBanner
            error={error}
            errorType={errorType}
            retryAfter={retryAfter}
            onDismiss={clearError}
            onRetry={messages.length > 0 ? () => {
              const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
              if (lastUserMsg) { clearError(); sendMessage(lastUserMsg.content); }
            } : undefined}
          />
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
                  fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                  fontWeight: 700,
                  background: 'linear-gradient(to right, #66ff4b, #ff5546)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: 6,
                  lineHeight: 1.15,
                }}
              >
                Olá{user?.displayName ? `, ${user.displayName.split(' ').slice(0, 2).join(' ')}` : ''}!
              </h1>
              <h2
                style={{
                  fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)',
                  color: 'var(--text-sec)',
                  fontWeight: 400,
                  lineHeight: 1.2,
                }}
              >
                Como posso te ajudar?
              </h2>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 48,
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
                    className="suggestion-card"
                    style={{
                      width: 220,
                      padding: '16px 18px',
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      borderRadius: 14,
                      background: 'var(--surface-variant)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      minHeight: 120,
                      gap: 16,
                    }}
                  >
                    <p style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.45 }}>
                      {sug.text}
                    </p>
                    <span
                      className="material-symbols-rounded"
                      style={{
                        fontSize: 20,
                        color: ['#1d7efd', '#28a745', '#ffc107'][i % 3],
                        opacity: 0.85,
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
                isTyping={isTyping}
                onEditMessage={editMessage}
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
          <ChatInput
            onSend={sendMessage}
            onStop={stopGeneration}
            isStreaming={messages.some(m => m.isStreaming)}
            disabled={isLoading || (isTyping && !messages.some(m => m.isStreaming))}
          />
        </div>
      </main>
    </div>
  );
};

export default Chat;
