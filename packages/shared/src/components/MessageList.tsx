// ===================================================
// Flavos IA 3.0 — MessageList Component
// ===================================================

import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
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
  isTyping = false,
  style,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o fim quando novas mensagens chegam
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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

      {/* Indicador de digitação — só aparece se não houver mensagem em streaming já visível */}
      {isTyping && !messages.some(m => m.isStreaming) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 20px',
            maxWidth: 980,
            margin: '0 auto',
            width: '100%',
            ...style?.loadingIndicator,
          }}
        >
          <img
            src="/Flavos_3.png"
            alt="Flavos"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
          <div
            style={{
              padding: '6px 0',
              color: 'var(--text-sec)',
              fontSize: '1rem',
              fontStyle: 'italic',
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
