// ===================================================
// Flavos IA 3.0 — Sidebar (Animações + Pin Mode)
// ===================================================

import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useSidebar } from '../hooks/useSidebar';
import type { ConversationMeta } from '../types';

/** Converte timestamp (ms) para texto relativo: "agora", "há 5 min", "ontem", etc. */
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000)              return 'agora';
  if (diff < 3_600_000)           return `há ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000)          return `há ${Math.floor(diff / 3_600_000)} h`;
  if (diff < 86_400_000 * 2)      return 'ontem';
  if (diff < 86_400_000 * 7)      return `há ${Math.floor(diff / 86_400_000)} dias`;
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/** CSS keyframes for conversation item stagger entry */
const CONV_ANIM_CSS = `
@keyframes convFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
`.trim();

export const Sidebar: React.FC = () => {
  const { mode, toggleTheme, theme } = useTheme();
  const { logout, user } = useAuth();
  const { isOpen, isPinned, open, close, toggle, togglePin } = useSidebar();
  const {
    clearMessages, loadConversations, loadConversation,
    unsubscribeAll, conversations, currentConversationId, pinConversation,
  } = useChat();
  const c = theme.colors;
  const SIDEBAR_W = 268;

  // 3-dot menu state
  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { if (user) loadConversations(); }, [user?.id]);

  // Close menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

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
        <ul style={{ flex: 1, listStyle: 'none', padding: '4px 8px', margin: 0, overflowY: 'auto' }}>
          {/* Inject keyframes once */}
          <style>{CONV_ANIM_CSS}</style>

          {conversations.length === 0 ? (
            <li style={{
              padding: '32px 12px', color: c.textSecondary, fontSize: 12.5,
              textAlign: 'center', opacity: 0.6,
            }}>
              Nenhuma conversa ainda.
            </li>
          ) : (
            conversations.map((conv: ConversationMeta, idx: number) => {
              const active   = currentConversationId === conv.id;
              const hovered  = hoveredId === conv.id;
              const menuOpen = openMenuId === conv.id;
              const time     = conv.lastMsgAt ? timeAgo(conv.lastMsgAt) : '';
              return (
                <li
                  key={conv.id}
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => { setHoveredId(null); }}
                  style={{
                    padding: '8px 6px 8px 10px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    marginBottom: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    position: 'relative',
                    zIndex: menuOpen ? 50 : hovered ? 10 : 1,
                    background: active
                      ? `${c.primary}14`
                      : hovered ? `${c.primary}0a` : 'transparent',
                    boxShadow: active ? `inset 0 0 0 1px ${c.primary}22` : 'none',
                    transition: 'background 0.18s ease, box-shadow 0.18s ease',
                    animation: `convFadeIn 220ms ${Math.min(idx * 30, 180)}ms both ease-out`,
                  }}
                  onMouseDown={(e) => {
                    // Don't scale when clicking the menu button
                    if ((e.target as HTMLElement).closest('[data-menu]')) return;
                    (e.currentTarget as HTMLElement).style.transform = 'scale(0.985)';
                    (e.currentTarget as HTMLElement).style.transition = 'transform 0.1s ease';
                  }}
                  onMouseUp={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLElement).style.transition = 'transform 0.2s ease';
                  }}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('[data-menu]')) return;
                    handleSelect(conv.id);
                  }}
                >
                  {/* Chat icon */}
                  <span style={{
                    width: 34, height: 34,
                    borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active
                      ? `${c.primary}22`
                      : mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    border: `1px solid ${active ? `${c.primary}35` : mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                    color: active ? c.primary : c.textSecondary,
                    transition: 'all 0.18s ease',
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 300", lineHeight: 1 }}>
                      chat_bubble
                    </span>
                  </span>

                  {/* Text block */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: 13.5, fontWeight: active ? 600 : 450,
                      color: c.text,
                      lineHeight: 1.35,
                      opacity: active ? 1 : 0.88,
                      transition: 'opacity 0.18s',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>
                        {conv.title}
                      </span>
                      {conv.pinned && (
                        <span className="material-symbols-rounded" style={{ fontSize: 13, color: c.primary, flexShrink: 0, fontVariationSettings: "'FILL' 1" }}>
                          push_pin
                        </span>
                      )}
                    </div>
                    {time && (
                      <div style={{ fontSize: 10.5, color: c.textSecondary, marginTop: 2, opacity: 0.65, letterSpacing: 0.1 }}>
                        {time}
                      </div>
                    )}
                  </div>

                  {/* 3-dot button — visible on hover or menu open */}
                  <div data-menu style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      data-menu
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(menuOpen ? null : conv.id); }}
                      title="Opções"
                      style={{
                        width: 28, height: 28, borderRadius: 8,
                        border: 'none', background: menuOpen
                          ? (mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')
                          : 'transparent',
                        color: c.textSecondary,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: hovered || menuOpen ? 1 : 0,
                        transition: 'opacity 0.15s ease, background 0.15s ease',
                        pointerEvents: hovered || menuOpen ? 'all' : 'none',
                      }}
                      onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'; }}
                      onMouseOut={(e) => { if (!menuOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 17, fontVariationSettings: "'wght' 400" }}>more_horiz</span>
                    </button>

                    {/* Popover menu */}
                    {menuOpen && (
                      <div
                        ref={menuRef}
                        data-menu
                        style={{
                          position: 'absolute', top: 32, right: 0, zIndex: 50,
                          background: mode === 'dark' ? '#1e1e2a' : '#fff',
                          border: `1px solid ${c.border}`,
                          borderRadius: 10,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                          minWidth: 160,
                          padding: '4px',
                          animation: 'convFadeIn 150ms ease-out both',
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            pinConversation(conv.id, !conv.pinned);
                            setOpenMenuId(null);
                          }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                            padding: '8px 10px', borderRadius: 7, border: 'none',
                            background: 'none', color: c.text, cursor: 'pointer',
                            fontSize: 13, fontFamily: 'inherit', textAlign: 'left',
                          }}
                          onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = `${c.primary}14`; }}
                          onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 16, color: c.primary, fontVariationSettings: conv.pinned ? "'FILL' 1" : "'FILL' 0" }}>push_pin</span>
                          {conv.pinned ? 'Desafixar' : 'Fixar conversa'}
                        </button>
                      </div>
                    )}
                  </div>
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
