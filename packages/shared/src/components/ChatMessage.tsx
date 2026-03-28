// ===================================================
// Flavos IA 3.0 — ChatMessage Component (Minimalista Gemini Base)
// ===================================================

import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message, GroundingSource, GroundingSupport, AttachmentMeta } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { dracula, highlightCode, getFileExtension } from '../utils/syntaxHighlighter';

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

// Renderizador customizado para Blocos de Código (Web)
const WebCodeBlock = ({ inline, className, children, colors }: any) => {
  const [copied, setCopied] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const isBlock = !inline && match;
  
  const contentStr = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(contentStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([contentStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = getFileExtension(language);
    a.download = `codigo-${language || 'snippet'}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isBlock) {
    return (
      <div style={{ background: dracula.bg, borderRadius: 8, margin: '1em 0', overflow: 'hidden', border: `1px solid rgba(255,255,255,0.1)`, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        {/* Header - Mac OS style + Dracula */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: dracula.header, borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
          {/* Mac dots & Language */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27c93f' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(248, 248, 242, 0.6)', textTransform: 'lowercase', fontWeight: 600, letterSpacing: 0.5 }}>{language || 'code'}</span>
          </div>
          
          {/* Actions */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <button onClick={() => setIsMinimized(!isMinimized)} title={isMinimized ? "Expandir" : "Minimizar"} style={{ background: 'transparent', border: 'none', color: dracula.fg, opacity: 0.6, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', padding: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{isMinimized ? 'unfold_more' : 'unfold_less'}</span>
            </button>
            <button onClick={handleCopy} title="Copiar" style={{ background: 'transparent', border: 'none', color: dracula.fg, opacity: 0.6, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', padding: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{copied ? 'check' : 'content_copy'}</span>
            </button>
            <button onClick={handleDownload} title="Baixar" style={{ background: 'transparent', border: 'none', color: dracula.fg, opacity: 0.6, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', padding: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>download</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div style={{ 
          height: isMinimized ? 0 : 'auto', 
          opacity: isMinimized ? 0 : 1, 
          overflow: isMinimized ? 'hidden' : 'auto',
          transition: 'all 0.2s ease-in-out'
        }}>
          <pre style={{ padding: '16px', margin: 0, fontSize: '0.88em', overflowX: 'auto' }}>
            <code style={{ fontFamily: '"Fira Code", "JetBrains Mono", monospace', color: dracula.fg }}>
              {highlightCode(contentStr, 'span')}
            </code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <code style={{ fontFamily: 'monospace', background: colors.surfaceVariant, borderRadius: 4, padding: '2px 6px', fontSize: '0.88em', color: dracula.keyword }}>
      {children}
    </code>
  );
};

interface ChatMessageProps {
  message: Message;
  onEdit?: (messageId: string, newContent: string) => void;
  style?: {
    container?: React.CSSProperties;
    bubble?: React.CSSProperties;
    text?: React.CSSProperties;
    avatar?: React.CSSProperties;
  };
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, style, onEdit }) => {
  const isUser = message.role === 'user';
  const { theme } = useTheme();
  const { user } = useAuth();
  const colors = theme.colors;
  const hasThoughts = !isUser && !!message.thoughts;
  const hasAttachments = !!(message.attachments?.length || message.attachmentsMeta?.length);

  // Edit state
  const [isHovered, setIsHovered] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(message.content);
  const editRef = React.useRef<HTMLTextAreaElement>(null);

  // Focus textarea when entering edit mode
  React.useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [isEditing]);

  const handleEditStart = () => {
    setEditValue(message.content);
    setIsEditing(true);
  };

  const handleEditSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== message.content && onEdit) {
      onEdit(message.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(message.content);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
    if (e.key === 'Escape') handleEditCancel();
  };

  /** Retorna ícone Material para um MIME type */
  const getMimeIcon = (mime: string) => {
    if (mime.startsWith('image/')) return 'image';
    if (mime === 'application/pdf') return 'picture_as_pdf';
    if (mime.startsWith('audio/')) return 'music_note';
    if (mime.startsWith('video/')) return 'movie';
    return 'description';
  };

  // Chips combinados: runtime (com base64) + stub do Firestore
  const metaChips: AttachmentMeta[] = [
    ...(message.attachments?.map(a => ({ name: a.name, mimeType: a.mimeType })) ?? []),
    ...(message.attachmentsMeta?.filter(
      meta => !message.attachments?.some(a => a.name === meta.name)
    ) ?? []),
  ];

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="msg-row"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 14,
        padding: '12px 20px',
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
          maxWidth: isUser ? '78%' : '100%',
          background: isUser ? colors.surfaceVariant : 'transparent',
          padding: isUser ? '11px 16px' : '4px 0',
          borderRadius: isUser ? '18px 4px 18px 18px' : 0,
          color: colors.text,
          fontSize: '1rem',
          lineHeight: 1.65,
          wordWrap: 'break-word',
          ...style?.bubble,
        }}
      >
        {isUser ? (
          <>
            {/* Attachments na mensagem do usuário */}
            {hasAttachments && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: message.content ? 8 : 0 }}>
                {/* Imagens inline */}
                {message.attachments?.filter(a => a.mimeType.startsWith('image/')).map((att, i) => (
                  <img
                    key={i}
                    src={att.previewUrl || `data:${att.mimeType};base64,${att.base64Data}`}
                    alt={att.name}
                    style={{ maxWidth: 200, maxHeight: 200, borderRadius: 10, objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => window.open(att.previewUrl || `data:${att.mimeType};base64,${att.base64Data}`)}
                  />
                ))}
                {/* Áudio inline */}
                {message.attachments?.filter(a => a.mimeType.startsWith('audio/')).map((att, i) => (
                  <div key={`audio-${i}`} style={{ width: '100%' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.78rem', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>music_note</span>
                      {att.name}
                    </p>
                    <audio controls src={`data:${att.mimeType};base64,${att.base64Data}`}
                      style={{ width: '100%', maxWidth: 320, height: 36, borderRadius: 8 }} />
                  </div>
                ))}
                {/* Vídeo inline */}
                {message.attachments?.filter(a => a.mimeType.startsWith('video/')).map((att, i) => (
                  <div key={`video-${i}`} style={{ width: '100%' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.78rem', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>movie</span>
                      {att.name}
                    </p>
                    <video controls src={`data:${att.mimeType};base64,${att.base64Data}`}
                      style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 10 }} />
                  </div>
                ))}
                {/* Chips: PDF/texto + metachips não-imagem/audio/video do Firestore */}
                {metaChips.filter(m => !m.mimeType.startsWith('image/') && !m.mimeType.startsWith('audio/') && !m.mimeType.startsWith('video/')).map((meta, i) => (
                  <div key={`meta-${i}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 20,
                    background: colors.surfaceVariant, border: `1px solid ${colors.border}`,
                    fontSize: '0.82rem', color: colors.textSecondary, maxWidth: 200, overflow: 'hidden',
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{getMimeIcon(meta.mimeType)}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.name}</span>
                  </div>
                ))}
                {/* Metachips áudio/vídeo do histórico */}
                {message.attachmentsMeta?.filter(m => (m.mimeType.startsWith('audio/') || m.mimeType.startsWith('video/')) && !message.attachments?.some(a => a.name === m.name)).map((meta, i) => (
                  <div key={`avmeta-${i}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 20,
                    background: colors.surfaceVariant, border: `1px solid ${colors.border}`,
                    fontSize: '0.82rem', color: colors.textSecondary,
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{getMimeIcon(meta.mimeType)}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.name}</span>
                  </div>
                ))}
                {/* Metachips de imagens do histórico */}
                {message.attachmentsMeta?.filter(m => m.mimeType.startsWith('image/') && !message.attachments?.some(a => a.name === m.name)).map((meta, i) => (
                  <div key={`imgmeta-${i}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 20,
                    background: colors.surfaceVariant, border: `1px solid ${colors.border}`,
                    fontSize: '0.82rem', color: colors.textSecondary,
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16 }}>image</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.name}</span>
                  </div>
                ))}
              </div>

            )}
            {/* Edit mode: inline textarea */}
            {isEditing ? (
              <div style={{ width: '100%' }}>
                <textarea
                  ref={editRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  rows={Math.min(10, (editValue.match(/\n/g)?.length ?? 0) + 2)}
                  style={{
                    width: '100%', resize: 'none', outline: 'none',
                    background: colors.background,
                    color: colors.text,
                    border: `1.5px solid ${colors.primary}`,
                    borderRadius: 10, padding: '10px 12px',
                    fontSize: '1rem', lineHeight: 1.6,
                    fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleEditCancel}
                    style={{
                      padding: '5px 14px', borderRadius: 8, border: `1px solid ${colors.border}`,
                      background: 'transparent', color: colors.textSecondary,
                      cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit',
                    }}
                  >Cancelar</button>
                  <button
                    onClick={handleEditSave}
                    disabled={!editValue.trim() || editValue.trim() === message.content}
                    style={{
                      padding: '5px 14px', borderRadius: 8, border: 'none',
                      background: colors.primary, color: '#fff',
                      cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit',
                      opacity: (!editValue.trim() || editValue.trim() === message.content) ? 0.5 : 1,
                    }}
                  >Salvar</button>
                </div>
              </div>
            ) : (
              <>
                {message.content && (
                  <span style={{ ...style?.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</span>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {/* Blink keyframe — injected once per render, no side-effects */}
            <style>{`@keyframes blink-cursor{0%,100%{opacity:1}50%{opacity:0}}`}</style>
            {/* ── Resumo de Pensamentos (Gemini Thinking UI) ── */}
            {hasThoughts && (
              <details
                style={{
                  marginBottom: 12,
                  color: colors.textSecondary,
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    outline: 'none',
                    listStyle: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.8rem',
                    fontStyle: 'italic',
                    opacity: 0.55,
                    letterSpacing: '0.01em',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 13 }}>psychology</span>
                  Pensamento
                </summary>
                <div
                  style={{
                    marginTop: 8,
                    paddingLeft: 12,
                    borderLeft: `1.5px solid ${colors.border}`,
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.8rem',
                    opacity: 0.5,
                  }}
                >
                  {message.thoughts}

                </div>
              </details>
            )}

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
                  code: ({ node, inline, className, children, ...props }: any) => (
                    <WebCodeBlock inline={inline} className={className} colors={colors}>
                      {children}
                    </WebCodeBlock>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote style={{ borderLeft: `3px solid ${colors.primary}`, paddingLeft: '1em', margin: '0.5em 0', color: colors.textSecondary, fontStyle: 'italic' }}>{children}</blockquote>
                  ),
                }}
              >
              {message.content}
            </ReactMarkdown>
            {/* Blinking cursor while streaming */}
            {message.isStreaming && (
              <span style={{
                display: 'inline-block',
                width: '2px',
                height: '1.1em',
                marginLeft: '2px',
                verticalAlign: 'text-bottom',
                backgroundColor: colors.primary,
                animation: 'blink-cursor 1s step-end infinite',
              }} aria-hidden="true" />
            )}
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

      {/* Lápis de edição — fora do bubble, visível no hover da row */}
      {isUser && onEdit && !isEditing && !message.isStreaming && (
        <button
          onClick={handleEditStart}
          title="Editar mensagem"
          style={{
            alignSelf: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: `1px solid ${colors.border}`,
            background: colors.background,
            color: colors.textSecondary,
            cursor: 'pointer',
            flexShrink: 0,
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'scale(1)' : 'scale(0.75)',
            transition: 'opacity 0.16s ease, transform 0.16s cubic-bezier(0.34,1.56,0.64,1), background 0.15s, color 0.15s',
            pointerEvents: isHovered ? 'auto' : 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.surfaceVariant;
            e.currentTarget.style.color = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.background;
            e.currentTarget.style.color = colors.textSecondary;
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>edit</span>
        </button>
      )}
    </div>
  );
};
