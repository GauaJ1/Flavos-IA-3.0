// ===================================================
// Flavos IA 3.0 — MobileChatMessage Component
// ===================================================

import React, { useState } from 'react';
import { View, Image, StyleSheet, Pressable, Linking, ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Message } from '@flavos/shared';
import { useAuth } from '@flavos/shared';
import { dracula, highlightCode, getFileExtension } from '@flavos/shared/src/utils/syntaxHighlighter';
import { useTheme } from '../theme';
import { Text } from './Text';

// Renderizador custom nativo para Blocos de Código (Mobile)
const MobileCodeBlock = ({ node, c }: any) => {
  const [copied, setCopied] = useState(false);
  const language = node.sourceInfo || 'code';
  const rawCode = String(node.content || '').replace(/\n$/, '');

  const handleCopy = async () => {
    await Clipboard.setStringAsync(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      // @ts-ignore: Tipagem do expo-file-system falhando no monorepo
      const fs = FileSystem as any;
      const ext = getFileExtension(language);
      const uri = (fs.documentDirectory || fs.cacheDirectory || '') + `codigo-${language || 'snippet'}.${ext}`;
      await FileSystem.writeAsStringAsync(uri, rawCode);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      console.log('Error sharing/downloading:', e);
    }
  };

  return (
    <View key={node.key} style={{ backgroundColor: dracula.bg, borderRadius: 10, marginVertical: 8, overflow: 'hidden', borderWidth: 1, borderColor: c.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: dracula.header, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Text style={{ fontSize: 12, color: dracula.fg, fontWeight: '600' }}>{language}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={handleCopy} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.8 }}>
            <MaterialIcons name={copied ? "check" : "content-copy"} size={14} color={dracula.fg} />
            <Text style={{ fontSize: 12, color: dracula.fg }}>{copied ? 'Copiado' : 'Copiar'}</Text>
          </Pressable>
          <Pressable onPress={handleDownload} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.8 }}>
            <MaterialIcons name="file-download" size={14} color={dracula.fg} />
            <Text style={{ fontSize: 12, color: dracula.fg }}>Baixar</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView horizontal bounces={false} style={{ padding: 12 }}>
        <Text style={{ fontFamily: 'monospace', color: dracula.fg, fontSize: 13 }}>
          {highlightCode(rawCode, Text)}
        </Text>
      </ScrollView>
    </View>
  );
};

interface MobileChatMessageProps {
  message: Message;
}

const MobileChatMessage: React.FC<MobileChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const { theme } = useTheme();
  const { user } = useAuth();
  const c = theme.colors;
  const [showThoughts, setShowThoughts] = useState(false);
  const hasThoughts = !isUser && !!message.thoughts;

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
        {/* ── Resumo de Pensamentos (Gemini Thinking UI) ── */}
        {hasThoughts && (
          <View style={{ marginBottom: 12 }}>
            <Pressable 
              style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.8 }}
              onPress={() => setShowThoughts((prev: boolean) => !prev)}
            >
              <Text style={{ color: c.textSecondary, fontSize: 13, fontStyle: 'italic', fontWeight: '600' }}>
                ▶ Pensamento
              </Text>
            </Pressable>
            
            {showThoughts && (
              <View style={{ 
                marginTop: 6, 
                marginLeft: 4, 
                paddingLeft: 10, 
                borderLeftWidth: 2, 
                borderLeftColor: c.border 
              }}>
                <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 20, opacity: 0.8 }}>
                  {message.thoughts}
                </Text>
              </View>
            )}
          </View>
        )}

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
          <Markdown 
            style={mdStyles}
            rules={{
              fence: (node) => <MobileCodeBlock key={node.key} node={node} c={c} />,
              code_block: (node) => <MobileCodeBlock key={node.key} node={node} c={c} />
            }}
          >
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
    borderBottomLeftRadius: 4,
    borderWidth: 0,
    padding: 0,
    backgroundColor: 'transparent',
  },
  thoughtsContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
    width: '100%',
  },
  thoughtsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  thoughtsTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  thoughtsBody: {
    padding: 12,
    borderTopWidth: 1,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  sourcesContainer: { marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  sourcesHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, marginBottom: 6 },
  sourcesLabel: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5 },
  sourcesChips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6 },
  sourceChip: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1 },
  sourceChipText: { fontSize: 11, flex: 1 },
});

export default MobileChatMessage;
