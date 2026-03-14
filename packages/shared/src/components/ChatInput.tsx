// ===================================================
// Flavos IA 3.0 — ChatInput Component (Minimalista)
// ===================================================

import React, { useState, useRef } from 'react';
import { APP_CONFIG } from '../utils/constants';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  style?: {
    container?: React.CSSProperties;
    wrapper?: React.CSSProperties;
    input?: React.CSSProperties;
    button?: React.CSSProperties;
  };
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Pergunte qualquer coisa',
  style,
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    resetHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isValid = text.trim().length > 0 && !disabled;

  // Auto-resize the textarea as content grows
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = '24px'; // reset first
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

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
          placeholder={placeholder}
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
          {/* Ícone de anexo (visual apenas) */}
          <button
            type="button"
            style={{
              width: 45,
              height: 45,
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--border)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="material-symbols-rounded">attach_file</span>
          </button>

          {/* Botão de Envio (Só aparece ou fica com cor primária quando válido) */}
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
