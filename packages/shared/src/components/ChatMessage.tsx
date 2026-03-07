// ===================================================
// Flavos IA 3.0 — ChatMessage Component (Minimalista Gemini Base)
// ===================================================

import React from 'react';
import type { Message } from '../types';
import { useTheme } from '../hooks/useTheme';

interface ChatMessageProps {
  message: Message;
  style?: {
    container?: React.CSSProperties;
    bubble?: React.CSSProperties;
    text?: React.CSSProperties;
    avatar?: React.CSSProperties;
  };
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, style }) => {
  const isUser = message.role === 'user';
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 16,
        padding: '16px 20px',
        width: '100%',
        margin: '0 auto',
        maxWidth: 980,
        ...style?.container,
      }}
    >
      {/* Avatar */}
      {isUser ? (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: colors.surfaceVariant,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#fff',
            ...style?.avatar,
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>person</span>
        </div>
      ) : (
        <img
          src="/Flavos_3.png"
          alt="Flavos"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            objectFit: 'contain',
            flexShrink: 0,
            ...style?.avatar,
          }}
        />
      )}

      {/* Content */}
      <div
        style={{
          flex: 1,
          maxWidth: isUser ? '75%' : '100%',
          background: isUser ? colors.surfaceVariant : 'transparent',
          padding: isUser ? '12px 16px' : '6px 0',
          borderRadius: isUser ? '16px 4px 16px 16px' : 0,
          color: colors.text,
          fontSize: '1rem',
          lineHeight: 1.6,
          wordWrap: 'break-word',
          whiteSpace: 'pre-line',
          ...style?.bubble,
        }}
      >
        <span style={{ ...style?.text }}>{message.content}</span>
      </div>
    </div>
  );
};
