// ===================================================
// Flavos IA 3.0 — MobileChatMessage Component
// ===================================================

import React from 'react';
import { View, Image, StyleSheet, Pressable, Linking } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { MaterialIcons } from '@expo/vector-icons';
import type { Message } from '@flavos/shared';
import { useAuth } from '@flavos/shared';
import { useTheme } from '../theme';
import { Text } from './Text';

interface MobileChatMessageProps {
  message: Message;
}

const MobileChatMessage: React.FC<MobileChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const { theme } = useTheme();
  const { user } = useAuth();
  const c = theme.colors;

  // Markdown styles specifically crafted for the Outfit font + our dark/light palettes
  const mdStyles = {
    body: { color: c.aiBubbleText, fontFamily: 'Outfit_400Regular', fontSize: 15, lineHeight: 23 },
    heading1: { color: c.text, fontFamily: 'Outfit_700Bold', fontSize: 20, marginTop: 8, marginBottom: 4 },
    heading2: { color: c.text, fontFamily: 'Outfit_600SemiBold', fontSize: 17, marginTop: 6, marginBottom: 3 },
    heading3: { color: c.text, fontFamily: 'Outfit_600SemiBold', fontSize: 15, marginTop: 4, marginBottom: 2 },
    strong: { fontFamily: 'Outfit_700Bold', color: c.text },
    em: { fontFamily: 'Outfit_300Light', color: c.text, fontStyle: 'italic' as const },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    bullet_list_icon: { color: c.primary, marginTop: 4, marginRight: 6 },
    list_item: { marginVertical: 2 },
    code_inline: {
      fontFamily: 'monospace',
      backgroundColor: c.surfaceVariant,
      color: c.primary,
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 1,
      fontSize: 13,
    },
    fence: {
      backgroundColor: c.surfaceVariant,
      borderRadius: 10,
      padding: 12,
      marginVertical: 6,
    },
    code_block: {
      fontFamily: 'monospace',
      fontSize: 13,
      color: c.text,
    },
    blockquote: {
      backgroundColor: 'transparent',
      borderLeftColor: c.primary,
      borderLeftWidth: 3,
      paddingLeft: 10,
      marginVertical: 4,
    },
    blockquote_text: { color: c.textSecondary, fontStyle: 'italic' as const },
    paragraph: { marginTop: 2, marginBottom: 2 },
  };

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
        {isUser ? (
          <Text
            style={[
              styles.text,
              { color: c.userBubbleText },
            ]}
          >
            {message.content}
          </Text>
        ) : (
          <Markdown style={mdStyles}>
            {message.content}
          </Markdown>
        )}

        {/* ── Fontes do Google Search Grounding ── */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <View style={styles.sourcesContainer}>
            <View style={styles.sourcesHeader}>
              <MaterialIcons name="search" size={13} color={c.textSecondary} />
              <Text style={[styles.sourcesLabel, { color: c.textSecondary }]}>Fontes</Text>
            </View>
            <View style={styles.sourcesChips}>
              {message.sources.slice(0, 3).map((src, i) => (
                <Pressable
                  key={i}
                  onPress={() => Linking.openURL(src.uri)}
                  style={({ pressed }) => [
                    styles.sourceChip,
                    { backgroundColor: c.surfaceVariant, borderColor: c.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <MaterialIcons name="open-in-new" size={11} color={c.primary} />
                  <Text numberOfLines={1} style={[styles.sourceChipText, { color: c.primary }]}>
                    {src.title.length > 40 ? src.title.slice(0, 37) + '…' : src.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Avatar do Usuário */}
      {isUser && (
        user?.photoURL ? (
          <Image
            source={{ uri: user.photoURL }}
            style={[styles.avatar, styles.userAvatarImg]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.userAvatarCircle, { backgroundColor: c.surfaceVariant }]}>
            <MaterialIcons name="person" size={22} color={c.textSecondary} />
          </View>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  userAvatarImg: {
    borderRadius: 18,
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
  sourcesContainer: { marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  sourcesHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, marginBottom: 6 },
  sourcesLabel: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5 },
  sourcesChips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6 },
  sourceChip: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1 },
  sourceChipText: { fontSize: 11, flex: 1 },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export default MobileChatMessage;
