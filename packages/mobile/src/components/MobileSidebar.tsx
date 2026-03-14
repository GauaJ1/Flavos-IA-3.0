// ===================================================
// Flavos IA 3.0 — MobileSidebar Component
// Animated slide-over drawer, mirroring web Sidebar
// ===================================================

import React, { useRef, useEffect } from 'react';
import {
  View,
  Pressable,
  Animated,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useAuth } from '@flavos/shared';
import { Text } from './Text';

const SIDEBAR_WIDTH = 280;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

const MOCK_CHATS = ['Ideias de Receitas', 'Debugação de Código', 'Plano de Estudos'];

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose, onNewChat }) => {
  const { theme, mode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const c = theme.colors;

  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isOpen ? 1 : 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <>
      {/* Dark overlay */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableWithoutFeedback onPress={onClose} accessible={false}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Sidebar panel */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            backgroundColor: c.surfaceVariant,
            borderRightColor: c.border,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Header spacer */}
        <View style={styles.headerSpacer} />

        {/* New Chat Button */}
        <Pressable
          onPress={handleNewChat}
          style={({ pressed }) => [
            styles.newChatBtn,
            { backgroundColor: c.background, borderColor: c.border },
            pressed && { opacity: 0.75 },
          ]}
          accessibilityLabel="Iniciar novo chat"
        >
          <MaterialIcons name="add" size={20} color={c.text} />
          <Text weight="medium" style={[styles.newChatText, { color: c.text }]}>Novo Chat</Text>
        </Pressable>

        {/* Section label */}
        <Text weight="semibold" style={[styles.sectionLabel, { color: c.textSecondary }]}>
          SEUS CHATS (MOCK)
        </Text>

        {/* Chat history list */}
        <ScrollView style={styles.chatList} showsVerticalScrollIndicator={false}>
          {MOCK_CHATS.map((title, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                styles.chatItem,
                pressed && { backgroundColor: c.background },
              ]}
              accessibilityLabel={title}
            >
              <MaterialIcons name="chat-bubble-outline" size={18} color={c.textSecondary} />
              <Text
                numberOfLines={1}
                style={[styles.chatItemText, { color: c.text }]}
              >
                {title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Bottom actions */}
        <View style={[styles.bottomActions, { borderTopColor: c.border }]}>
          <Pressable
            onPress={toggleTheme}
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && { backgroundColor: c.background },
            ]}
            accessibilityLabel="Alternar tema"
          >
            <MaterialIcons
              name={mode === 'dark' ? 'light-mode' : 'dark-mode'}
              size={22}
              color={c.text}
            />
            <Text weight="medium" style={[styles.actionText, { color: c.text }]}>
              {mode === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && { backgroundColor: c.background },
            ]}
            accessibilityLabel="Sair da conta"
          >
            <MaterialIcons name="logout" size={22} color={c.error} />
            <Text weight="medium" style={[styles.actionText, { color: c.error }]}>Sair</Text>
          </Pressable>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 20,
    borderRightWidth: 1,
    paddingHorizontal: 14,
    paddingBottom: 24,
    flexDirection: 'column',
  },
  headerSpacer: {
    height: 64,
    marginBottom: 8,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  newChatText: {
    fontSize: 15,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    paddingLeft: 8,
    marginBottom: 10,
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  chatItemText: {
    fontSize: 14,
    flex: 1,
  },
  bottomActions: {
    marginTop: 'auto',
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 15,
  },
});

export default MobileSidebar;
