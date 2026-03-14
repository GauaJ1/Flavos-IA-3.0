// ===================================================
// Flavos IA 3.0 — MobileMessageList Component
// ===================================================

import React, { useRef, useEffect } from 'react';
import { ScrollView, View, Image, StyleSheet } from 'react-native';
import type { Message } from '@flavos/shared';
import { useTheme } from '../theme';
import { Text } from './Text';
import MobileChatMessage from './MobileChatMessage';

interface MobileMessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

const MobileMessageList: React.FC<MobileMessageListProps> = ({
  messages,
  isLoading = false,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const { theme } = useTheme();
  const c = theme.colors;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 || isLoading) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isLoading]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {messages.map((msg) => (
        <MobileChatMessage key={msg.id} message={msg} />
      ))}

      {/* Typing indicator */}
      {isLoading && (
        <View style={styles.typingRow}>
          <Image
            source={require('../../assets/Flavos_3.png')}
            style={styles.typingAvatar}
            resizeMode="contain"
          />
          <Text style={[styles.typingText, { color: c.textSecondary }]}>
            Pensando...
          </Text>
        </View>
      )}

      {/* Bottom spacer so content doesn't hide behind the input */}
      <View style={{ height: 16 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
    flexGrow: 1,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  typingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  typingText: {
    fontSize: 15,
    fontStyle: 'italic',
  },
});

export default MobileMessageList;
