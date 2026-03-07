// ===================================================
// Flavos IA 3.0 — MessageList Component
// ===================================================

import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  /** Platform-specific styles */
  style?: {
    container?: React.CSSProperties;
    emptyState?: React.CSSProperties;
    loadingIndicator?: React.CSSProperties;
  };
}

/**
 * Lista de mensagens do chat com auto-scroll.
 * Exibe estado vazio quando não há mensagens.
 * Mostra indicador de digitação quando a IA está gerando resposta.
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  style,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o fim quando novas mensagens chegam
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 0',
        ...style?.container,
      }}
    >
      {messages.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            opacity: 0.5,
            textAlign: 'center',
            padding: '40px 20px',
            ...style?.emptyState,
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <p style={{ fontSize: '16px', color: '#9494a8' }}>
            Comece uma conversa com a IA!
          </p>
          <p style={{ fontSize: '13px', color: '#6a6a80', marginTop: '8px' }}>
            Powered by Gemini 3.1-flash
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}

      {/* Indicador de digitação */}
      {isLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            ...style?.loadingIndicator,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c5cfc, #b94cfc)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              marginRight: 8,
            }}
          >
            F
          </div>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '18px 18px 18px 4px',
              background: '#1e1e2e',
              color: '#9494a8',
              fontSize: '14px',
            }}
          >
            <span className="typing-indicator">Pensando...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
