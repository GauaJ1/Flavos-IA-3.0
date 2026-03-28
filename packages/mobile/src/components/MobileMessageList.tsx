// ===================================================
// Flavos IA 3.0 — MobileMessageList Component
// ===================================================

import React, { useRef, useEffect } from 'react';
import { ScrollView, View, Image, StyleSheet, Animated } from 'react-native';
import type { Message } from '@flavos/shared';
import { useTheme } from '../theme';
import MobileChatMessage from './MobileChatMessage';

interface MobileMessageListProps {
  messages: Message[];
  isTyping?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

// ── Animated typing dots ──────────────────────────────────
const TypingDot = ({ delay, color }: { delay: number; color: string }) => {
  const scale = useRef(new Animated.Value(0.65)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1,    duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1,    duration: 300, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 0.65, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4,  duration: 300, useNativeDriver: true }),
        ]),
        Animated.delay(600 - delay),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[styles.dot, { backgroundColor: color, transform: [{ scale }], opacity }]} />
  );
};

const MobileMessageList: React.FC<MobileMessageListProps> = ({
  messages,
  isTyping = false,
  onEditMessage,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const { theme } = useTheme();
  const c = theme.colors;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [messages.length, isTyping]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {messages.map((msg) => (
        <MobileChatMessage
          key={msg.id}
          message={msg}
          onEdit={msg.role === 'user' ? onEditMessage : undefined}
        />
      ))}

      {/* Typing indicator — só aparece se não houver mensagem em streaming já visível */}
      {isTyping && !messages.some(m => m.isStreaming) && (
        <View style={styles.typingRow}>
          <Image
            source={require('../../assets/Flavos_3.png')}
            style={styles.typingAvatar}
            resizeMode="contain"
          />
          <View style={styles.dotsRow}>
            <TypingDot delay={0}   color={c.textSecondary} />
            <TypingDot delay={160} color={c.textSecondary} />
            <TypingDot delay={320} color={c.textSecondary} />
          </View>
        </View>
      )}

      {/* Bottom spacer so content doesn't hide behind the input */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    flexGrow: 1,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  typingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});

export default MobileMessageList;
