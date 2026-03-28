// ===================================================
// Flavos IA 3.0 — MobileChatMessage Component
// ===================================================

import React, { useState, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, Pressable, Linking, ScrollView, Animated, Modal, TextInput, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAudioPlayer } from 'expo-audio';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { Message, AttachmentMeta, MediaAttachment } from '@flavos/shared';
import { useAuth } from '@flavos/shared';
import { dracula, highlightCode, getFileExtension } from '@flavos/shared/src/utils/syntaxHighlighter';
import { useTheme } from '../theme';
import { Text } from './Text';

// ── Sub-componente: Player de Áudio (expo-audio) ──
const MobileAudioPlayer = ({ att, c }: { att: MediaAttachment; c: any }) => {
  const player = useAudioPlayer(`data:${att.mimeType};base64,${att.base64Data}`);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4,
      backgroundColor: c.surfaceVariant, borderRadius: 12, padding: 10 }}>
      <Pressable onPress={togglePlay}
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.primary,
          alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name={player.playing ? 'pause' : 'play-arrow'} size={20} color="#fff" />
      </Pressable>
      <Text style={{ color: c.textSecondary, fontSize: 12, flex: 1 }} numberOfLines={1}>
        {att.name}
      </Text>
    </View>
  );
};

// ── Sub-componente: Player de Vídeo (expo-video) ──
const MobileVideoPlayer = ({ att }: { att: MediaAttachment }) => {
  const player = useVideoPlayer(`data:${att.mimeType};base64,${att.base64Data}`);
  return (
    <VideoView
      player={player}
      allowsPictureInPicture={false}
      style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 4 }}
    />
  );
};

// Renderizador custom nativo para Blocos de Código (Mobile)
const MobileCodeBlock = ({ node, c }: any) => {
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
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
    <View key={node.key} style={{ backgroundColor: dracula.bg, borderRadius: 10, marginVertical: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
      {/* Header - Mac OS style + Dracula */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: dracula.header, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
        {/* Mac dots & Language */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff5f56' }} />
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffbd2e' }} />
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#27c93f' }} />
          </View>
          <Text style={{ fontSize: 11, color: 'rgba(248,248,242,0.6)', fontWeight: '600', letterSpacing: 0.5 }}>{language}</Text>
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Pressable onPress={() => setIsMinimized(!isMinimized)} hitSlop={10} style={{ opacity: 0.7 }}>
            <MaterialIcons name={isMinimized ? "unfold-more" : "unfold-less"} size={16} color={dracula.fg} />
          </Pressable>
          <Pressable onPress={handleCopy} hitSlop={10} style={{ opacity: 0.7 }}>
            <MaterialIcons name={copied ? "check" : "content-copy"} size={14} color={dracula.fg} />
          </Pressable>
          <Pressable onPress={handleDownload} hitSlop={10} style={{ opacity: 0.7 }}>
            <MaterialIcons name="file-download" size={16} color={dracula.fg} />
          </Pressable>
        </View>
      </View>
      
      {/* Code Content */}
      {!isMinimized && (
        <ScrollView horizontal bounces={false} contentContainerStyle={{ padding: 14 }}>
          <Text style={{ fontFamily: 'monospace', color: dracula.fg, fontSize: 13, lineHeight: 18 }}>
            {highlightCode(rawCode, Text)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

interface MobileChatMessageProps {
  message: Message;
  onEdit?: (messageId: string, newContent: string) => void;
}

const MobileChatMessage: React.FC<MobileChatMessageProps> = ({ message, onEdit }) => {
  const isUser = message.role === 'user';
  const { theme } = useTheme();
  const { user } = useAuth();
  const c = theme.colors;
  const [showThoughts, setShowThoughts] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [showEditIcon, setShowEditIcon] = useState(false);
  const editIconTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasThoughts = !isUser && !!message.thoughts;
  const hasAttachments = !!(message.attachments?.length || message.attachmentsMeta?.length);

  // Blinking cursor for streaming messages
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!message.isStreaming) { cursorOpacity.setValue(1); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [message.isStreaming]);

  function getMimeIconName(mimeType: string): keyof typeof MaterialIcons.glyphMap {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'picture-as-pdf';
    if (mimeType.startsWith('audio/')) return 'music-note';
    if (mimeType.startsWith('video/')) return 'movie';
    return 'description';
  }

  // Chips combinados: runtime + stub do Firestore
  const metaChips: AttachmentMeta[] = [
    ...(message.attachments?.map(a => ({ name: a.name, mimeType: a.mimeType })) ?? []),
    ...(message.attachmentsMeta?.filter(
      meta => !message.attachments?.some(a => a.name === meta.name)
    ) ?? []),
  ];

  // Markdown styles optimized for Outfit font
  const mdStyles = {
    body: { color: c.aiBubbleText, fontFamily: 'Outfit_400Regular', fontSize: 15.5, lineHeight: 24 },
    heading1: { color: c.text, fontFamily: 'Outfit_700Bold', fontSize: 20, marginTop: 10, marginBottom: 5 },
    heading2: { color: c.text, fontFamily: 'Outfit_600SemiBold', fontSize: 17, marginTop: 8, marginBottom: 4 },
    heading3: { color: c.text, fontFamily: 'Outfit_600SemiBold', fontSize: 15, marginTop: 6, marginBottom: 3 },
    strong: { fontFamily: 'Outfit_700Bold', color: c.text },
    em: { fontFamily: 'Outfit_300Light', color: c.text, fontStyle: 'italic' as const },
    bullet_list: { marginVertical: 5 },
    ordered_list: { marginVertical: 5 },
    bullet_list_icon: { color: c.primary, marginTop: 5, marginRight: 6 },
    list_item: { marginVertical: 3 },
    code_inline: {
      fontFamily: 'monospace',
      backgroundColor: c.surfaceVariant,
      color: c.primary,
      borderRadius: 4,
      paddingHorizontal: 5,
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
      marginVertical: 5,
    },
    blockquote_text: { color: c.textSecondary, fontStyle: 'italic' as const },
    paragraph: { marginTop: 3, marginBottom: 3 },
    hr: { borderColor: c.border, borderTopWidth: 1, marginVertical: 10 },
    table: { borderWidth: 1, borderColor: c.border, borderRadius: 8, marginVertical: 6 },
    thead: { backgroundColor: c.surfaceVariant },
    td: { borderColor: c.border, padding: 6 },
    th: { borderColor: c.border, padding: 6, fontFamily: 'Outfit_600SemiBold' },
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

      {/* Edit Modal */}
      {isUser && onEdit && (
        <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowEditModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                  <View style={[styles.editModal, { backgroundColor: c.surface ?? c.surfaceVariant, borderColor: c.border }]}>
                    <Text style={{ color: c.textSecondary, fontSize: 12, marginBottom: 10, fontWeight: '600', letterSpacing: 0.3 }}>
                      EDITAR MENSAGEM
                    </Text>
                    <TextInput
                      value={editValue}
                      onChangeText={setEditValue}
                      multiline
                      style={[styles.editInput, {
                        color: c.text,
                        backgroundColor: c.background,
                        borderColor: c.primary,
                      }]}
                      autoFocus
                      scrollEnabled
                    />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                      <Pressable
                        onPress={() => { setEditValue(message.content); setShowEditModal(false); }}
                        style={[styles.editBtn, { borderColor: c.border, borderWidth: 1 }]}
                      >
                        <Text style={{ color: c.textSecondary, fontSize: 14 }}>Cancelar</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          const t = editValue.trim();
                          if (t && t !== message.content && onEdit) onEdit(message.id, t);
                          setShowEditModal(false);
                        }}
                        disabled={!editValue.trim() || editValue.trim() === message.content}
                        style={[styles.editBtn, {
                          backgroundColor: c.primary,
                          opacity: (!editValue.trim() || editValue.trim() === message.content) ? 0.5 : 1,
                          flex: 1,
                        }]}
                      >
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Salvar</Text>
                      </Pressable>
                    </View>
                  </View>
                </KeyboardAvoidingView>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Edit pencil — aparece fora do bubble após long-press */}
      {isUser && showEditIcon && onEdit && (
        <Pressable
          onPress={() => {
            if (editIconTimer.current) clearTimeout(editIconTimer.current);
            setShowEditIcon(false);
            setEditValue(message.content);
            setShowEditModal(true);
          }}
          style={{
            alignSelf: 'center',
            padding: 9,
            borderRadius: 22,
            backgroundColor: c.background,
            borderWidth: 1,
            borderColor: c.border,
            marginRight: 8,
          }}
        >
          <MaterialIcons name="edit" size={17} color={c.primary} />
        </Pressable>
      )}

      {/* Bubble */}
      <Pressable
        onLongPress={() => {
          if (isUser && onEdit && !message.isStreaming) {
            if (editIconTimer.current) clearTimeout(editIconTimer.current);
            setShowEditIcon(true);
            editIconTimer.current = setTimeout(() => setShowEditIcon(false), 3000);
          }
        }}
        delayLongPress={400}
        style={{ maxWidth: '80%' }}
      >
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.bubbleUser, { backgroundColor: c.userBubble }]
              : [styles.bubbleAI, { backgroundColor: 'transparent' }],
          ]}
        >
        {/* ── Anexos / Attachments ── */}
        {isUser && hasAttachments && (
          <View style={{ marginBottom: message.content ? 8 : 0 }}>
            {/* Imagens com thumbnail */}
            {message.attachments?.filter(a => a.mimeType.startsWith('image/')).map((att, i) => (
              <Image
                key={`img-${i}`}
                source={{ uri: att.previewUrl || `data:${att.mimeType};base64,${att.base64Data}` }}
                style={[styles.attachImg, { marginBottom: 4 }]}
                resizeMode="cover"
              />
            ))}
            {/* Áudio inline via expo-av */}
            {message.attachments?.filter(a => a.mimeType.startsWith('audio/')).map((att, i) => (
              <MobileAudioPlayer key={`audio-${i}`} att={att} c={c} />
            ))}
            {/* Vídeo inline via expo-av */}
            {message.attachments?.filter(a => a.mimeType.startsWith('video/')).map((att, i) => (
              <MobileVideoPlayer key={`video-${i}`} att={att} />
            ))}
            {/* Chips para PDF/texto + metachips não-imagem/audio/video do Firestore */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {metaChips.filter(m => !m.mimeType.startsWith('image/') && !m.mimeType.startsWith('audio/') && !m.mimeType.startsWith('video/')).map((meta, i) => (
                <View key={`chip-${i}`} style={[styles.chip, { backgroundColor: c.surfaceVariant, borderColor: c.border }]}>
                  <MaterialIcons name={getMimeIconName(meta.mimeType)} size={14} color={c.textSecondary} />
                  <Text style={{ color: c.textSecondary, fontSize: 12, maxWidth: 140 }} numberOfLines={1}>
                    {meta.name}
                  </Text>
                </View>
              ))}
              {/* Metachips áudio/vídeo histórico */}
              {message.attachmentsMeta?.filter(m => (m.mimeType.startsWith('audio/') || m.mimeType.startsWith('video/')) && !message.attachments?.some(a => a.name === m.name)).map((meta, i) => (
                <View key={`avmeta-${i}`} style={[styles.chip, { backgroundColor: c.surfaceVariant, borderColor: c.border }]}>
                  <MaterialIcons name={getMimeIconName(meta.mimeType)} size={14} color={c.textSecondary} />
                  <Text style={{ color: c.textSecondary, fontSize: 12, maxWidth: 140 }} numberOfLines={1}>
                    {meta.name}
                  </Text>
                </View>
              ))}
              {/* Meta chips de imagens do histórico */}
              {message.attachmentsMeta?.filter(m => m.mimeType.startsWith('image/') && !message.attachments?.some(a => a.name === m.name)).map((meta, i) => (
                <View key={`imgmeta-${i}`} style={[styles.chip, { backgroundColor: c.surfaceVariant, borderColor: c.border }]}>
                  <MaterialIcons name="image" size={14} color={c.textSecondary} />
                  <Text style={{ color: c.textSecondary, fontSize: 12, maxWidth: 140 }} numberOfLines={1}>
                    {meta.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Resumo de Pensamentos (Gemini Thinking UI) ── */}
        {hasThoughts && (
          <View style={{ marginBottom: 10 }}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.5 }}
              onPress={() => setShowThoughts((prev: boolean) => !prev)}
              hitSlop={8}
            >
              <MaterialIcons name="psychology" size={13} color={c.textSecondary} />
              <Text style={{ color: c.textSecondary, fontSize: 12, fontStyle: 'italic' }}>
                Pensamento
              </Text>
              <MaterialIcons
                name={showThoughts ? 'expand-less' : 'expand-more'}
                size={14}
                color={c.textSecondary}
              />
            </Pressable>

            {showThoughts && (
              <View style={{
                marginTop: 6,
                paddingLeft: 10,
                borderLeftWidth: 1.5,
                borderLeftColor: `${c.border}`,
                opacity: 0.5,
              }}>
                <Text style={{ color: c.textSecondary, fontSize: 12.5, lineHeight: 19 }}>
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
          <>
            <Markdown 
              style={mdStyles}
              rules={{
                fence: (node) => <MobileCodeBlock key={node.key} node={node} c={c} />,
                code_block: (node) => <MobileCodeBlock key={node.key} node={node} c={c} />
              }}
            >
              {message.content}
            </Markdown>
            {/* Blinking cursor while streaming */}
            {message.isStreaming && (
              <Animated.View style={{
                width: 2, height: 18, marginLeft: 2, marginTop: 2,
                backgroundColor: c.primary,
                opacity: cursorOpacity,
              }} />
            )}
          </>
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
      </Pressable>

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
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
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
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleUser: {
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    borderRadius: 0,
    paddingLeft: 0,
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
  attachImg: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  // ── Edit modal styles ────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  editModal: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  editInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    maxHeight: 200,
    textAlignVertical: 'top',
  },
  editBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});

export default MobileChatMessage;
