// ===================================================
// Flavos IA 3.0 — MobileSidebar (Firestore realtime)
// ===================================================

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View, Pressable, Animated, StyleSheet,
  ScrollView, TouchableWithoutFeedback, Image, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useAuth, useChat } from '@flavos/shared';
import { Text } from './Text';
import type { ConversationMeta } from '@flavos/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Converte timestamp (ms) para texto relativo */
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000)            return 'agora';
  if (diff < 3_600_000)         return `há ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000)        return `há ${Math.floor(diff / 3_600_000)} h`;
  if (diff < 86_400_000 * 2)    return 'ontem';
  if (diff < 86_400_000 * 7)    return `há ${Math.floor(diff / 86_400_000)} dias`;
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/** Animated conversation item — fades in with stagger */
const AnimatedConvItem: React.FC<{
  conv: ConversationMeta;
  active: boolean;
  delay: number;
  onPress: () => void;
  onLongPress: () => void;
  colors: any;
}> = ({ conv, active, delay, onPress, onLongPress, colors: c }) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 220, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const time   = conv.lastMsgAt ? timeAgo(conv.lastMsgAt) : '';

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.chatItem,
          active && { backgroundColor: `${c.primary}14` },
          pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
        ]}
        accessibilityLabel={conv.title}
      >
        {/* Chat icon — outline */}
        <View style={[
          styles.letterIcon,
          {
            backgroundColor: active ? `${c.primary}26` : 'rgba(255,255,255,0.07)',
            borderColor: active ? `${c.primary}40` : 'rgba(255,255,255,0.07)',
          },
        ]}>
          <MaterialIcons
            name="chat-bubble-outline"
            size={17}
            color={active ? c.primary : c.textSecondary}
          />
        </View>

        {/* Text block */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text
              numberOfLines={1}
              weight={active ? 'semibold' : 'regular'}
              style={[styles.chatItemTitle, { color: c.text, opacity: active ? 1 : 0.88, flex: 1 }]}
            >
              {conv.title}
            </Text>
            {conv.pinned && (
              <MaterialIcons name="push-pin" size={11} color={c.textSecondary} style={{ opacity: 0.55 }} />
            )}
          </View>
          {!!time && (
            <Text style={[styles.chatItemTime, { color: c.textSecondary }]}>
              {time}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const SIDEBAR_WIDTH = 280;

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose, onNewChat }) => {
  const { theme, mode, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const {
    conversations, currentConversationId,
    loadConversations, loadConversation, unsubscribeAll, pinConversation,
  } = useChat();
  const c = theme.colors;

  const [longPressedConv, setLongPressedConv] = useState<ConversationMeta | null>(null);

  // Animações de entrada/saída
  const translateX    = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sidebarScale  = useRef(new Animated.Value(0.96)).current;

  // Inicia listener realtime ao logar
  useEffect(() => {
    if (user) loadConversations();
  }, [user?.id]);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(translateX,   { toValue: 0,              damping: 22,  stiffness: 200, mass: 0.9, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(sidebarScale, { toValue: 1,              damping: 20,  stiffness: 180, mass: 0.8, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX,    { toValue: -SIDEBAR_WIDTH, duration: 240, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0,              duration: 200, useNativeDriver: true }),
        Animated.timing(sidebarScale,  { toValue: 0.96,            duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  const handleNewChat = () => { onNewChat(); onClose(); };

  const handleSelectConversation = async (id: string) => {
    if (id !== currentConversationId) await loadConversation(id);
    onClose();
  };

  const handleLogout = async () => {
    unsubscribeAll();
    onClose();
    await logout();
  };

  return (
    <>
      {/* Overlay escuro */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents={isOpen ? 'auto' : 'none'}>
        <TouchableWithoutFeedback onPress={onClose} accessible={false}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Painel */}
      <Animated.View
        style={[
          styles.sidebar,
          { backgroundColor: c.surfaceVariant, borderRightColor: c.border,
            transform: [{ translateX }, { scaleX: sidebarScale }, { scaleY: sidebarScale }] },
        ]}
      >
        {/* Cabeçalho com info do usuário */}
        <View style={[styles.userRow, { borderBottomColor: c.border }]}>
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.userAvatar}
            />
          ) : (
            <View style={[styles.userAvatarPlaceholder, { backgroundColor: c.surfaceVariant, borderColor: c.border }]}>
              <MaterialIcons name="person" size={20} color={c.textSecondary} />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text weight="semibold" style={[styles.userName, { color: c.text }]} numberOfLines={1}>
              {user?.displayName || 'Usuário'}
            </Text>
            <Text style={[styles.userEmail, { color: c.textSecondary }]} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>

        {/* Novo Chat */}
        <Pressable
          onPress={handleNewChat}
          style={({ pressed }) => [
            styles.newChatBtn,
            { backgroundColor: c.background, borderColor: c.border },
            pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
          ]}
          accessibilityLabel="Iniciar novo chat"
        >
          <MaterialIcons name="edit" size={18} color={c.text} />
          <Text weight="medium" style={[styles.newChatText, { color: c.text }]}>Novo Chat</Text>
        </Pressable>

        {/* Label */}
        <Text weight="semibold" style={[styles.sectionLabel, { color: c.textSecondary }]}>
          CONVERSAS
        </Text>

        {/* Lista realtime */}
        <ScrollView style={styles.chatList} showsVerticalScrollIndicator={false}>
          {conversations.length === 0 ? (
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              Nenhuma conversa ainda.
            </Text>
          ) : (
            conversations.map((conv: ConversationMeta, idx: number) => (
              <AnimatedConvItem
                key={conv.id}
                conv={conv}
                active={currentConversationId === conv.id}
                delay={Math.min(idx * 30, 180)}
                onPress={() => handleSelectConversation(conv.id)}
                onLongPress={() => setLongPressedConv(conv)}
                colors={c}
              />
            ))
          )}
        </ScrollView>

        {/* Ações do rodapé */}
        <View style={[styles.bottomActions, { borderTopColor: c.border }]}>
          <Pressable
            onPress={() => {
              const newMode = mode === 'dark' ? 'light' : 'dark';
              AsyncStorage.setItem('flavos_theme_mode', newMode).catch(() => {});
              toggleTheme();
            }}
            style={({ pressed }) => [styles.actionBtn, pressed && { backgroundColor: c.background }]}
            accessibilityLabel="Alternar tema"
          >
            <MaterialIcons name={mode === 'dark' ? 'light-mode' : 'dark-mode'} size={22} color={c.text} />
            <Text weight="medium" style={[styles.actionText, { color: c.text }]}>
              {mode === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.actionBtn, pressed && { backgroundColor: c.background }]}
            accessibilityLabel="Sair da conta"
          >
            <MaterialIcons name="logout" size={22} color={c.error} />
            <Text weight="medium" style={[styles.actionText, { color: c.error }]}>Sair</Text>
          </Pressable>
        </View>

        {/* Modal de Interação (Long Press) Premium */}
        <Modal
          visible={!!longPressedConv}
          transparent
          animationType="fade"
          onRequestClose={() => setLongPressedConv(null)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' }}>
            <TouchableWithoutFeedback onPress={() => setLongPressedConv(null)}>
              <View style={StyleSheet.absoluteFillObject} />
            </TouchableWithoutFeedback>
            
            {longPressedConv && (
              <Animated.View style={{
                width: 290,
                backgroundColor: c.surface,
                borderRadius: 20,
                padding: 6,
                paddingBottom: 8,
                borderWidth: 1,
                borderColor: c.border,
                elevation: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
              }}>
                {/* Cabeçalho do Modal (Título da conversa truncado) */}
                <View style={{ padding: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: c.border, marginBottom: 4 }}>
                   <Text weight="semibold" numberOfLines={1} style={{ fontSize: 13, color: c.textSecondary, textAlign: 'center' }}>
                     {longPressedConv.title}
                   </Text>
                </View>

                {/* Opções */}
                <Pressable
                  onPress={() => {
                    pinConversation(longPressedConv.id, !longPressedConv.pinned);
                    setLongPressedConv(null);
                  }}
                  style={({ pressed }) => [
                    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14 },
                    pressed && { backgroundColor: c.background }
                  ]}
                >
                  <MaterialIcons 
                    name="push-pin" 
                    size={20} 
                    color={c.primary} 
                    style={{ transform: [{ rotate: longPressedConv.pinned ? '45deg' : '0deg' }] }}
                  />
                  <Text weight="medium" style={{ fontSize: 15, color: c.text }}>
                    {longPressedConv.pinned ? 'Desafixar conversa' : 'Fixar conversa'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setLongPressedConv(null)}
                  style={({ pressed }) => [
                    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14 },
                    pressed && { backgroundColor: c.background }
                  ]}
                >
                  <MaterialIcons name="close" size={20} color={c.textSecondary} />
                  <Text weight="medium" style={{ fontSize: 15, color: c.textSecondary }}>
                    Cancelar
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </Modal>

      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 },
  sidebar:  { position: 'absolute', top: 0, left: 0, bottom: 0, width: SIDEBAR_WIDTH, zIndex: 20, borderRightWidth: 1, paddingHorizontal: 14, paddingBottom: 24, flexDirection: 'column' },
  userRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, paddingTop: 52, borderBottomWidth: 1, marginBottom: 12 },
  userAvatar: { width: 36, height: 36, borderRadius: 18 },
  userAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1 },
  userName:  { fontSize: 14 },
  userEmail: { fontSize: 11, marginTop: 1 },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 20, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 16 },
  newChatText: { fontSize: 14 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.2, paddingLeft: 8, marginBottom: 8 },
  chatList: { flex: 1 },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 20 },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 1,
  },
  letterIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
  },
  chatItemTitle:   { fontSize: 13.5, lineHeight: 18 },
  chatItemTime:    { fontSize: 10.5, marginTop: 2, opacity: 0.65 },
  bottomActions: { marginTop: 'auto', borderTopWidth: 1, paddingTop: 14, gap: 4 },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  actionText: { fontSize: 15 },
});

export default MobileSidebar;
