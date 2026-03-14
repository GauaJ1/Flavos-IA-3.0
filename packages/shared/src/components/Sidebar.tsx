// ===================================================
// Flavos IA 3.0 — Sidebar (Animações + Pin Mode)
// ===================================================

import React, { useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useSidebar } from '../hooks/useSidebar';
import type { ConversationMeta } from '../types';

export const Sidebar: React.FC = () => {
  const { mode, toggleTheme, theme } = useTheme();
  const { logout, user } = useAuth();
  const { isOpen, isPinned, open, close, toggle, togglePin } = useSidebar();
  const {
    clearMessages, loadConversations, loadConversation,
    unsubscribeAll, conversations, currentConversationId,
  } = useChat();
  const c = theme.colors;
  const SIDEBAR_W = 268;

  useEffect(() => { if (user) loadConversations(); }, [user?.id]);

  // Bloqueia scroll do body só no modo overlay (não fixado)
  useEffect(() => {
    document.body.style.overflow = isOpen && !isPinned ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isPinned]);

  const handleNewChat = () => { clearMessages(); if (!isPinned) close(); };

  const handleSelect = async (id: string) => {
    if (id !== currentConversationId) await loadConversation(id);
    if (!isPinned) close();
  };

  const handleLogout = async () => {
    unsubscribeAll();
    close();
    await logout();
  };

  const navBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, background: 'none',
    border: 'none', color: c.text, padding: '9px 10px', borderRadius: 8,
    cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit',
    fontSize: 13.5, transition: 'background 0.15s',
  };

  return (
    <>
      {/* ── Hamburger / X button ─────────────────── */}
      <button
        onClick={toggle}
        aria-label={isOpen || isPinned ? 'Fechar menu' : 'Abrir menu'}
        style={{
          position: 'fixed',
          top: 12, left: isPinned ? SIDEBAR_W + 12 : 14,
          zIndex: 700,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 8, borderRadius: 8, color: c.text,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Animated hamburger → X using 3 bars */}
        <span style={{ position: 'relative', width: 20, height: 18, display: 'block' }}>
          {[0, 1, 2].map((i) => {
            const isX = isOpen || isPinned;
            const baseTop = i === 0 ? 0 : i === 1 ? 8 : 16;
            const xTop = i === 1 ? 8 : 8; // both line 0 and 2 pivot from center
            const computedTop = isX && i !== 1 ? xTop : baseTop;
            const style: React.CSSProperties = {
              position: 'absolute',
              left: 0, right: 0,
              height: 2, borderRadius: 2,
              background: c.text,
              transformOrigin: 'center',
              transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s, top 0.28s cubic-bezier(0.4,0,0.2,1)',
              top: computedTop,
              opacity: isX && i === 1 ? 0 : 1,
              transform: isX && i === 0 ? 'rotate(45deg)'
                       : isX && i === 1 ? 'scaleX(0)'
                       : isX && i === 2 ? 'rotate(-45deg)'
                       : 'none',
            };
            return <span key={i} style={style} />;
          })}
        </span>
      </button>

      {/* ── Overlay (só no modo não fixado) ─────── */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          zIndex: 500,
          opacity: isOpen && !isPinned ? 1 : 0,
          pointerEvents: isOpen && !isPinned ? 'all' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* ── Painel da Sidebar ────────────────────── */}
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: SIDEBAR_W,
          zIndex: 600,
          display: 'flex', flexDirection: 'column',
          background: c.surfaceVariant,
          borderRight: `1px solid ${c.border}`,
          boxShadow: isPinned ? '2px 0 8px rgba(0,0,0,0.1)' : '4px 0 24px rgba(0,0,0,0.25)',
          transform: isOpen || isPinned ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`,
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s',
          willChange: 'transform',
        }}
      >
        {/* Cabeçalho */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 14px 10px 52px', // deixa espaço p/ o hamburger fixo
          borderBottom: `1px solid ${c.border}`, flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: c.text, letterSpacing: 0.2 }}>
            Flavos IA
          </span>

          {/* Botão PIN */}
          <button
            onClick={togglePin}
            aria-label={isPinned ? 'Desafixar sidebar' : 'Fixar sidebar'}
            title={isPinned ? 'Soltar sidebar' : 'Fixar sidebar aberta'}
            style={{
              background: isPinned ? `${c.primary}22` : 'none',
              border: `1px solid ${isPinned ? c.primary : 'transparent'}`,
              color: isPinned ? c.primary : c.textSecondary,
              cursor: 'pointer', padding: '4px 8px',
              borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11.5, fontWeight: isPinned ? 600 : 400, fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
          >
            <span
              className="material-symbols-rounded"
              style={{
                fontSize: 16,
                transform: isPinned ? 'rotate(-45deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              push_pin
            </span>
            {isPinned ? 'Fixada' : 'Fixar'}
          </button>
        </div>

        {/* Novo Chat */}
        <div style={{ padding: '12px 10px 4px' }}>
          <button
            onClick={handleNewChat}
            style={{
              ...navBtn, fontWeight: 500,
              background: c.background, border: `1px solid ${c.border}`,
              justifyContent: 'flex-start',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>edit_square</span>
            Novo Chat
          </button>
        </div>

        {/* Label */}
        <p style={{
          margin: 0, padding: '10px 18px 4px',
          fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
          textTransform: 'uppercase', color: c.textSecondary,
        }}>Conversas</p>

        {/* Lista */}
        <ul style={{ flex: 1, listStyle: 'none', padding: '2px 8px', margin: 0, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <li style={{ padding: '20px 12px', color: c.textSecondary, fontSize: 12.5, textAlign: 'center' }}>
              Nenhuma conversa ainda.
            </li>
          ) : (
            conversations.map((conv: ConversationMeta) => {
              const active = currentConversationId === conv.id;
              return (
                <li
                  key={conv.id}
                  onClick={() => handleSelect(conv.id)}
                  style={{
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    marginBottom: 2, display: 'flex', flexDirection: 'column', gap: 2,
                    background: active ? `${c.primary}1a` : 'transparent',
                    borderLeft: `3px solid ${active ? c.primary : 'transparent'}`,
                    transition: 'background 0.15s',
                  }}
                  onMouseOver={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = `${c.primary}0d`; }}
                  onMouseOut={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span style={{
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? c.primary : c.text,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {conv.title}
                  </span>
                  {conv.lastMsgPreview && (
                    <span style={{
                      fontSize: 11, color: c.textSecondary,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {conv.lastMsgRole === 'assistant' ? '🤖 ' : ''}{conv.lastMsgPreview}
                    </span>
                  )}
                </li>
              );
            })
          )}
        </ul>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${c.border}`, padding: '10px 8px 12px', flexShrink: 0 }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 10px' }}>
              {user.photoURL ? (
                <img
                  src={user.photoURL} alt="Avatar"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <span className="material-symbols-rounded" style={{ color: c.textSecondary, fontSize: 26 }}>account_circle</span>
              )}
              <span style={{ fontSize: 12.5, color: c.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName || user.email}
              </span>
            </div>
          )}

          <button
            onClick={toggleTheme}
            style={navBtn}
            onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = c.background)}
            onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
              {mode === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            {mode === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
          </button>

          <button
            onClick={handleLogout}
            style={{ ...navBtn, color: c.error }}
            onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = c.background)}
            onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>logout</span>
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};
