// ===================================================
// Flavos IA 3.0 — ChatMessage Component (Minimalista Gemini Base)
// ===================================================

import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message, GroundingSource, GroundingSupport } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

// Anota o texto com links inline usando groundingSupports
// Ex: "Espanha ganhou a Euro 2024" → "[Espanha ganhou a Euro 2024](https://...)"
function annotateWithSources(
  text: string,
  supports: GroundingSupport[],
  sources: GroundingSource[]
): string {
  if (!supports?.length || !sources?.length) return text;
  let result = text;
  // Ordena por comprimento desc para substiuir frases maiores antes de substrings
  const sorted = [...supports].sort((a, b) => b.text.length - a.text.length);
  for (const support of sorted) {
    const src = sources[support.sourceIndices[0]];
    if (!src || !support.text.trim()) continue;
    const escaped = support.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Evita re-anotar texto que já está dentro de um link markdown
    result = result.replace(
      new RegExp(`(?<!\\[)${escaped}(?!\\])(?!\\()`, 'g'),
      `[${support.text}](${src.uri})`
    );
  }
  return result;
}

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
  const { user } = useAuth();
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
        user?.photoURL ? (
          // Avatar do Google (somente contas Google)
          <img
            src={user.photoURL}
            alt="Você"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              objectFit: 'cover', flexShrink: 0,
              ...style?.avatar,
            }}
          />
        ) : (
          // Fallback: ícone genérico para contas email/senha
          <div
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: colors.surfaceVariant,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, color: colors.textSecondary,
              ...style?.avatar,
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>person</span>
          </div>
        )
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
          <>
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
                      <pre style={{ background: colors.surfaceVariant, borderRadius: 10, padding: '12px 16px', margin: '0.6em 0', overflowX: 'auto', fontSize: '0.88em' }}>
                        <code style={{ fontFamily: 'monospace', color: colors.text }}>{children}</code>
                      </pre>
                    ) : (
                      <code style={{ fontFamily: 'monospace', background: colors.surfaceVariant, borderRadius: 4, padding: '2px 6px', fontSize: '0.88em', color: colors.primary }}>{children}</code>
                    );
                  },
                  blockquote: ({ children }) => (
                    <blockquote style={{ borderLeft: `3px solid ${colors.primary}`, paddingLeft: '1em', margin: '0.5em 0', color: colors.textSecondary, fontStyle: 'italic' }}>{children}</blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* ── Fontes do Google Search Grounding ── */}
            {message.sources && message.sources.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: colors.textSecondary, marginBottom: 8 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 15 }}>search</span>
                  <span style={{ fontWeight: 600, letterSpacing: '0.03em' }}>Fontes</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {message.sources.slice(0, 3).map((src, i) => (
                    <a
                      key={i}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 20,
                        background: colors.surfaceVariant, border: `1px solid ${colors.border}`,
                        fontSize: '0.78rem', color: colors.primary,
                        textDecoration: 'none', transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 13 }}>open_in_new</span>
                      {src.title.length > 50 ? src.title.slice(0, 47) + '…' : src.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
