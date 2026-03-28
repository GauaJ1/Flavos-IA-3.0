// ===================================================
// Flavos IA 3.0 — MobileTrashPanel
// Modal premium da lixeira para iOS/Android
// ===================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@flavos/shared';
import type { ConversationMeta } from '@flavos/shared';

const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

function daysRemaining(trashedAt?: number): string {
  if (!trashedAt) return '';
  const diffMs = (trashedAt + FOUR_DAYS_MS) - Date.now();
  if (diffMs <= 0) return 'Expira em breve';
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days >= 1) return `Apaga em ${days}d ${hours}h`;
  return `Apaga em ${hours}h`;
}

interface MobileTrashPanelProps {
  visible: boolean;
  conversations: ConversationMeta[];
  onRestore: (id: string) => Promise<void>;
  onHardDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export const MobileTrashPanel: React.FC<MobileTrashPanelProps> = ({
  visible,
  conversations,
  onRestore,
  onHardDelete,
  onClose,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRestore = async (id: string) => {
    setLoadingId(id);
    try { await onRestore(id); } finally { setLoadingId(null); }
  };

  const handleHardDelete = async (id: string) => {
    setLoadingId(id);
    try { await onHardDelete(id); setConfirmId(null); } finally { setLoadingId(null); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: c.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Pressable onPress={onClose} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={c.textSecondary} />
          </Pressable>
          <MaterialIcons name="delete" size={18} color={c.textSecondary} />
          <Text style={[styles.headerTitle, { color: c.text }]}>Lixeira</Text>
        </View>

        {/* Aviso 4 dias */}
        <View style={[styles.notice, { backgroundColor: c.surfaceVariant }]}>
          <MaterialIcons name="schedule" size={13} color={c.textSecondary} />
          <Text style={[styles.noticeText, { color: c.textSecondary }]}>
            Itens apagados permanentemente após 4 dias
          </Text>
        </View>

        {/* Lista */}
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="delete-sweep" size={52} color={c.textSecondary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>Sua lixeira está vazia</Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.item,
                  { borderBottomColor: c.border, opacity: loadingId === item.id ? 0.5 : 1 },
                ]}
              >
                {/* Título + timer */}
                <View style={styles.itemRow}>
                  <Text style={[styles.itemTitle, { color: c.text }]} numberOfLines={1}>
                    {item.title || 'Conversa sem título'}
                  </Text>
                  <Text style={[styles.itemTimer, { color: c.textSecondary }]}>
                    {daysRemaining(item.trashedAt)}
                  </Text>
                </View>

                {/* Ações */}
                {loadingId === item.id ? (
                  <ActivityIndicator size="small" color={c.primary} style={{ marginTop: 8 }} />
                ) : confirmId === item.id ? (
                  <View style={styles.confirmRow}>
                    <Text style={[styles.confirmText, { color: c.textSecondary }]}>
                      Excluir permanentemente?
                    </Text>
                    <Pressable
                      onPress={() => setConfirmId(null)}
                      style={[styles.actionBtn, { borderColor: c.border }]}
                    >
                      <Text style={[styles.actionBtnText, { color: c.textSecondary }]}>Cancelar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleHardDelete(item.id)}
                      style={[styles.actionBtn, styles.deleteBtn]}
                    >
                      <Text style={[styles.actionBtnText, { color: '#fff' }]}>Excluir</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.actionsRow}>
                    <Pressable
                      onPress={() => handleRestore(item.id)}
                      style={[styles.actionBtn, { borderColor: c.primary }]}
                    >
                      <MaterialIcons name="restore" size={14} color={c.primary} />
                      <Text style={[styles.actionBtnText, { color: c.primary }]}>Restaurar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setConfirmId(item.id)}
                      style={[styles.actionBtn, { borderColor: '#e5393540' }]}
                    >
                      <MaterialIcons name="delete-forever" size={14} color="#e53935" />
                      <Text style={[styles.actionBtnText, { color: '#e53935' }]}>Excluir</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 4 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    margin: 12,
    padding: '8px 12px' as any,
    borderRadius: 10,
  },
  noticeText: { fontSize: 12, flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    opacity: 0.5,
  },
  emptyText: { fontSize: 15 },
  item: {
    padding: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  itemTitle: { fontSize: 14, fontWeight: '500', flex: 1 },
  itemTimer: { fontSize: 11, flexShrink: 0 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  confirmText: { fontSize: 12, flex: 1 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  deleteBtn: { backgroundColor: '#e53935', borderColor: '#e53935' },
  actionBtnText: { fontSize: 13, fontWeight: '500' },
});
