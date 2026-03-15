// ===================================================
// Flavos IA 3.0 — ChatInput Component (with Media Upload)
// ===================================================

import React, { useState, useRef } from 'react';
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
  disabled = false,
  placeholder = 'Pergunte qualquer coisa',
  style,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
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
    el.style.height = '24px';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

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
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          minHeight: 56,
          background: 'var(--input-bg)',
          borderRadius: 28,
          padding: '6px 8px 6px 24px',
          boxSizing: 'border-box',
          gap: 4,
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
          placeholder={attachments.length > 0 ? 'Adicione uma pergunta sobre os arquivos...' : placeholder}
          disabled={disabled}
          maxLength={APP_CONFIG.MAX_MESSAGE_LENGTH}
          style={{
            flex: 1,
            minHeight: 24,
            maxHeight: 200,
            background: 'none',
            border: 'none',
            color: 'var(--text)',
            fontSize: '1rem',
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'none',
            lineHeight: '24px',
            padding: '10px 0',
            margin: 0,
            overflowY: 'auto',
            display: 'block',
            ...style?.input,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

          {/* Botão de Envio */}
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
              transition: 'all 0.3s',
              ...style?.button,
            }}
          >
            <span className="material-symbols-rounded">send</span>
          </button>
        </div>
      </div>
      <p
        style={{
          fontSize: '0.8rem',
          color: 'var(--placeholder)',
          marginTop: 12,
          textAlign: 'center',
        }}
      >
        Atualmente Flavos IA pode cometer erros, reveja as respostas.
      </p>
    </div>
  );
};
