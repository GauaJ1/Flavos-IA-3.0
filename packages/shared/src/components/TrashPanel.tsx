// ===================================================
// Flavos IA 3.0 — TrashPanel (Web)
// Painel da lixeira: lista, restaura e apaga permanentemente conversas.
// ===================================================

import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { ConversationMeta } from '../types';

const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

function daysRemaining(trashedAt?: number): string {
  if (!trashedAt) return '';
  const expiresAt = trashedAt + FOUR_DAYS_MS;
  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) return 'Expira em breve';
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days >= 1) return `Apaga em ${days}d ${hours}h`;
  return `Apaga em ${hours}h`;
}

interface TrashPanelProps {
  conversations: ConversationMeta[];
  onRestore: (id: string) => Promise<void>;
  onHardDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export const TrashPanel: React.FC<TrashPanelProps> = ({
  conversations,
  onRestore,
  onHardDelete,
  onClose,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRestore = async (id: string) => {
    setLoadingId(id);
    try { await onRestore(id); } finally { setLoadingId(null); }
  };

  const handleHardDelete = async (id: string) => {
    setLoadingId(id);
    try { await onHardDelete(id); setConfirmDeleteId(null); } finally { setLoadingId(null); }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: colors.background,
      color: colors.text,
      fontFamily: 'Outfit, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '18px 16px 14px',
        borderBottom: `1px solid ${colors.border}`,
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          title="Voltar"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: colors.textSecondary, padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>arrow_back</span>
        </button>
        <span className="material-symbols-rounded" style={{ fontSize: 20, color: colors.textSecondary }}>delete</span>
        <span style={{ fontWeight: 600, fontSize: '1rem' }}>Lixeira</span>
      </div>

      {/* Aviso */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '12px 12px 4px',
        padding: '8px 12px',
        borderRadius: 10,
        background: colors.surfaceVariant,
        fontSize: '0.78rem',
        color: colors.textSecondary,
        flexShrink: 0,
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 15 }}>schedule</span>
        Itens apagados permanentemente após 4 dias
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {conversations.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '60%', gap: 12,
            color: colors.textSecondary, opacity: 0.6,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 48 }}>delete_sweep</span>
            <span style={{ fontSize: '0.9rem' }}>Sua lixeira está vazia</span>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              style={{
                padding: '10px 14px',
                borderBottom: `1px solid ${colors.border}`,
                opacity: loadingId === conv.id ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {/* Título + timer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontWeight: 500, fontSize: '0.88rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1,
                }}>
                  {conv.title || 'Conversa sem título'}
                </span>
                <span style={{
                  fontSize: '0.72rem', color: colors.textSecondary,
                  flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  {daysRemaining(conv.trashedAt)}
                </span>
              </div>

              {/* Ações */}
              {confirmDeleteId === conv.id ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: colors.textSecondary, flex: 1 }}>
                    Confirmar exclusão permanente?
                  </span>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    disabled={loadingId === conv.id}
                    style={{
                      padding: '3px 10px', borderRadius: 6, border: `1px solid ${colors.border}`,
                      background: 'transparent', color: colors.textSecondary,
                      cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit',
                    }}
                  >Cancelar</button>
                  <button
                    onClick={() => handleHardDelete(conv.id)}
                    disabled={loadingId === conv.id}
                    style={{
                      padding: '3px 10px', borderRadius: 6, border: 'none',
                      background: '#e53935', color: '#fff',
                      cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit',
                    }}
                  >Excluir</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleRestore(conv.id)}
                    disabled={loadingId === conv.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '3px 10px', borderRadius: 6,
                      border: `1px solid ${colors.border}`,
                      background: 'transparent', color: colors.primary,
                      cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>restore</span>
                    Restaurar
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(conv.id)}
                    disabled={loadingId === conv.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '3px 10px', borderRadius: 6,
                      border: `1px solid ${'#e5393540'}`,
                      background: 'transparent', color: '#e53935',
                      cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>delete_forever</span>
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
