// ===================================================
// Flavos IA 3.0 — ChatMessage Component (Minimalista Gemini Base)
// ===================================================

import React from 'react';
import ReactMarkdown from 'react-markdown';
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

  const markdownStyles: React.CSSProperties = {
    margin: 0,
    padding: 0,
    fontSize: '1rem',
    lineHeight: 1.7,
    color: colors.text,
    wordWrap: 'break-word',
  };

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
          flex: isUser ? '0 1 auto' : 1,
          width: isUser ? 'fit-content' : undefined,
          maxWidth: isUser ? '75%' : '100%',
          background: isUser ? colors.surfaceVariant : 'transparent',
          padding: isUser ? '12px 16px' : '6px 0',
          borderRadius: isUser ? '16px 4px 16px 16px' : 0,
          color: colors.text,
          fontSize: '1rem',
          lineHeight: 1.6,
          wordWrap: 'break-word',
          ...style?.bubble,
        }}
      >
        {isUser ? (
          <span style={{ ...style?.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</span>
        ) : (
          <div
            style={markdownStyles}
            className="ai-markdown"
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 style={{ fontSize: '1.4em', fontWeight: 700, margin: '0.6em 0 0.3em', color: colors.text }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: '1.2em', fontWeight: 600, margin: '0.6em 0 0.3em', color: colors.text }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontSize: '1.05em', fontWeight: 600, margin: '0.5em 0 0.2em', color: colors.text }}>{children}</h3>,
                p: ({ children }) => <p style={{ margin: '0.3em 0', lineHeight: 1.7, color: colors.text }}>{children}</p>,
                strong: ({ children }) => <strong style={{ fontWeight: 700, color: colors.text }}>{children}</strong>,
                em: ({ children }) => <em style={{ fontStyle: 'italic', color: colors.text }}>{children}</em>,
                ul: ({ children }) => <ul style={{ paddingLeft: '1.4em', margin: '0.4em 0', color: colors.text }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ paddingLeft: '1.4em', margin: '0.4em 0', color: colors.text }}>{children}</ol>,
                li: ({ children }) => <li style={{ margin: '0.2em 0', lineHeight: 1.6, color: colors.text }}>{children}</li>,
                code: ({ node, className, children, ...props }) => {
                  const isBlock = className?.startsWith('language-');
                  return isBlock ? (
                    <pre style={{
                      background: colors.surfaceVariant,
                      borderRadius: 10,
                      padding: '12px 16px',
                      margin: '0.6em 0',
                      overflowX: 'auto',
                      fontSize: '0.88em',
                    }}>
                      <code style={{ fontFamily: 'monospace', color: colors.text }}>{children}</code>
                    </pre>
                  ) : (
                    <code style={{
                      fontFamily: 'monospace',
                      background: colors.surfaceVariant,
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: '0.88em',
                      color: colors.primary,
                    }}>{children}</code>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote style={{
                    borderLeft: `3px solid ${colors.primary}`,
                    paddingLeft: '1em',
                    margin: '0.5em 0',
                    color: colors.textSecondary,
                    fontStyle: 'italic',
                  }}>{children}</blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
