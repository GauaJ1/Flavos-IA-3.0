// ===================================================
// Flavos IA 3.0 — MobileChatMessage Component
// ===================================================

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Message } from '@flavos/shared';
import { useTheme } from '../theme';
import { Text } from './Text';

interface MobileChatMessageProps {
  message: Message;
}

const MobileChatMessage: React.FC<MobileChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}>
      {/* AI Avatar */}
      {!isUser && (
        <Image
          source={require('../../assets/Flavos_3.png')}
          style={styles.avatar}
          resizeMode="contain"
        />
      )}

      {/* Bubble */}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: c.userBubble }]
            : [styles.bubbleAI, { backgroundColor: 'transparent' }],
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: isUser ? c.userBubbleText : c.aiBubbleText },
          ]}
        >
          {message.content}
        </Text>
      </View>

      {/* User Avatar */}
      {isUser && (
        <View style={[styles.avatar, styles.userAvatarCircle, { backgroundColor: c.surfaceVariant }]}>
          <MaterialIcons name="person" size={22} color={c.textSecondary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAI: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    flexShrink: 0,
  },
  userAvatarCircle: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '78%',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleUser: {
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    borderRadius: 0,
    paddingLeft: 0,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export default MobileChatMessage;
