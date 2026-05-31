// ===================================================
// Flavos IA 3.0 — ChatInput Component (with Media Upload)
// ===================================================

import React, { useState, useRef, useCallback } from 'react';
import { APP_CONFIG } from '../utils/constants';
import type { MediaAttachment } from '../types';

// Tipos MIME aceitos
const ACCEPTED_TYPES = [
  'image/jpeg','image/png','image/webp','image/bmp',
  'application/pdf',
  'audio/mpeg','audio/mp4','audio/wav','audio/aiff',
  'video/mp4','video/webm',
  'text/plain','text/html','text/csv','text/xml','application/json',
].join(',');

interface ChatInputProps {
  onSend: (message: string, attachments?: MediaAttachment[]) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  style?: {
    container?: React.CSSProperties;
    wrapper?: React.CSSProperties;
    input?: React.CSSProperties;
    button?: React.CSSProperties;
  };
}

/** Retorna ícone Material para um MIME type */
function getMimeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'picture_as_pdf';
  if (mimeType.startsWith('audio/')) return 'music_note';
  if (mimeType.startsWith('video/')) return 'movie';
  return 'description';
}

/** Converte File para base64 (sem prefixo data:...) */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove o prefixo "data:mime/type;base64,"
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
  placeholder = 'Pergunte qualquer coisa',
  style,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [pasteToast, setPasteToast] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || disabled) return;
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setText('');
    setAttachments([]);
    resetHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  /** Exibe toast de confirmação de imagem colada */
  const showPasteToast = useCallback(() => {
    setPasteToast(true);
    if (pasteToastTimer.current) clearTimeout(pasteToastTimer.current);
    pasteToastTimer.current = setTimeout(() => setPasteToast(false), 2500);
  }, []);

  /** Lida com paste de imagens da área de transferência */
  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItems = items.filter((item) => item.type.startsWith('image/'));
    if (imageItems.length === 0) return;

    // Previne o comportamento padrão de colar texto de imagem
    e.preventDefault();

    const currentCount = attachments.length;
    const slotsAvailable = 5 - currentCount;
    if (slotsAvailable <= 0) return;

    const newAttachments: MediaAttachment[] = await Promise.all(
      imageItems.slice(0, slotsAvailable).map(async (item, idx) => {
        const file = item.getAsFile();
        if (!file) return null;
        const base64Data = await fileToBase64(file);
        const previewUrl = URL.createObjectURL(file);
        // Gera nome legível: "imagem-colada-1.png"
        const ext = file.type.split('/')[1] || 'png';
        const name = `imagem-colada-${currentCount + idx + 1}.${ext}`;
        return { name, mimeType: file.type, base64Data, previewUrl } as MediaAttachment;
      })
    );

    const valid = newAttachments.filter(Boolean) as MediaAttachment[];
    if (valid.length > 0) {
      setAttachments((prev) => [...prev, ...valid].slice(0, 5));
      showPasteToast();
    }
  }, [attachments.length, showPasteToast]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newAttachments: MediaAttachment[] = await Promise.all(
      files.slice(0, 5).map(async (file) => {
        const base64Data = await fileToBase64(file);
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
        return {
          name: file.name,
          mimeType: file.type,
          base64Data,
          previewUrl,
        };
      })
    );

    setAttachments((prev) => [...prev, ...newAttachments].slice(0, 5));
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const next = [...prev];
      // Revoke objectURL to avoid memory leaks
      if (next[index].previewUrl) URL.revokeObjectURL(next[index].previewUrl!);
      next.splice(index, 1);
      return next;
    });
  };

  const isValid = (text.trim().length > 0 || attachments.length > 0) && !disabled;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 20px',
        width: '100%',
        maxWidth: 980,
        margin: '0 auto',
        ...style?.container,
      }}
    >
      {/* Chips de preview dos anexos */}
      {attachments.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            width: '100%',
            marginBottom: 10,
          }}
        >
          {attachments.map((att, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'var(--surface-variant)',
                border: '1px solid var(--border)',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                maxWidth: 220,
                overflow: 'hidden',
              }}
            >
              {att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                  {getMimeIcon(att.mimeType)}
                </span>
              )}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {att.name}
              </span>
              <button
                onClick={() => removeAttachment(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-secondary)',
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className="chat-input-wrapper"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          width: '100%',
          minHeight: 54,
          background: 'var(--input-bg)',
          borderRadius: 28,
          padding: '8px 8px 8px 22px',
          boxSizing: 'border-box',
          gap: 4,
          border: '1.5px solid var(--border)',
          ...style?.wrapper,
        }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleChange}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={attachments.length > 0 ? 'Adicione uma pergunta sobre os arquivos...' : placeholder}
          disabled={disabled}
          maxLength={APP_CONFIG.MAX_MESSAGE_LENGTH}
          style={{
            flex: 1,
            minHeight: 38,
            maxHeight: 200,
            background: 'none',
            border: 'none',
            color: 'var(--text)',
            fontSize: '1rem',
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'none',
            lineHeight: '1.5',
            padding: '9px 0',
            margin: 0,
            overflowY: 'auto',
            display: 'block',
            alignSelf: 'stretch',
            ...style?.input,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 4 }}>
          {/* Input de arquivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            hidden
            onChange={handleFileSelect}
          />

          {/* Botão de anexo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="Anexar arquivo"
            style={{
              width: 45,
              height: 45,
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              color: attachments.length > 0 ? 'var(--primary)' : 'var(--text)',
              cursor: disabled ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.3s',
              position: 'relative',
            }}
            onMouseOver={(e) => { if (!disabled) e.currentTarget.style.background = 'var(--border)'; }}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="material-symbols-rounded">attach_file</span>
            {attachments.length > 0 && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: 6,
                background: 'var(--primary)',
                color: '#fff',
                borderRadius: '50%',
                width: 14,
                height: 14,
                fontSize: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}>
                {attachments.length}
              </span>
            )}
          </button>

          {/* Botão de Envio / Stop */}
          {isStreaming ? (
            // Stop button — aparece quando a IA está gerando
            <button
              onClick={onStop}
              title="Parar geração"
              style={{
                width: 45,
                height: 45,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--primary)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                animation: 'stop-pulse 1.5s ease-in-out infinite',
                ...style?.button,
              }}
            >
              <style>{`@keyframes stop-pulse{0%,100%{box-shadow:0 0 0 0 var(--primary-40,rgba(99,102,241,.4))}50%{box-shadow:0 0 0 8px transparent}}`}</style>
              <span className="material-symbols-rounded" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>stop</span>
            </button>
          ) : (
            // Send button — estado normal
            <button
              onClick={handleSend}
              disabled={!isValid}
              style={{
                width: 45,
                height: 45,
                borderRadius: '50%',
                border: 'none',
                background: isValid ? 'var(--primary)' : 'transparent',
                color: isValid ? '#fff' : 'var(--placeholder)',
                cursor: isValid ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s, transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
                ...style?.button,
              }}
              onMouseEnter={(e) => { if (isValid) e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span className="material-symbols-rounded">send</span>
            </button>
          )}
        </div>
      </div>
      {/* Toast de confirmação de imagem colada */}
      <div
        style={{
          position: 'fixed',
          bottom: 90,
          left: '50%',
          transform: `translateX(-50%) translateY(${pasteToast ? 0 : 12}px)`,
          opacity: pasteToast ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          background: 'var(--surface-variant, rgba(30,30,40,0.92))',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.85rem',
          color: 'var(--text)',
          zIndex: 9999,
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap',
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--primary)' }}>image</span>
        Imagem colada da área de transferência
      </div>

      <p
        style={{
          fontSize: '0.78rem',
          color: 'var(--text-sec)',
          marginTop: 10,
          textAlign: 'center',
          opacity: 0.6,
        }}
      >
        Flavos IA pode cometer erros. Revise as respostas importantes.
      </p>
    </div>
  );
};
