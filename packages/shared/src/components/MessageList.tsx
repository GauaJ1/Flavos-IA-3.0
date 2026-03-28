// ===================================================
// Flavos IA 3.0 — MessageList Component
// ===================================================

import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
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
  onEditMessage,
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
            opacity: 0.45,
            textAlign: 'center',
            padding: '40px 20px',
            ...style?.emptyState,
          }}
        >
          <div style={{ fontSize: '44px', marginBottom: '12px' }}>💬</div>
          <p style={{ fontSize: '15px', color: 'var(--text)' }}>
            Comece uma conversa com a IA!
          </p>
          <p style={{ fontSize: '12.5px', color: 'var(--text-sec)', marginTop: '6px' }}>
            Powered by Gemini
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          onEdit={msg.role === 'user' ? onEditMessage : undefined}
        />
      ))}

      {/* Indicador de digitação — só aparece se não houver mensagem em streaming já visível */}
      {isTyping && !messages.some(m => m.isStreaming) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 20px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingTop: 4 }}>
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
