// ===================================================
// Flavos IA 3.0 — MobileChatInput Component (with Media Upload)
// ===================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  Image,
  Modal,
  TouchableOpacity,
  Text as RNText,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../theme';
import { Text } from './Text';
import type { MediaAttachment } from '@flavos/shared/src/types';

interface MobileChatInputProps {
  onSend: (message: string, attachments?: MediaAttachment[]) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  bottomInset?: number;
}

/** Retorna nome do ícone MaterialIcons para um MIME type */
function getMimeIconName(mimeType: string): keyof typeof MaterialIcons.glyphMap {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'picture-as-pdf';
  if (mimeType.startsWith('audio/')) return 'music-note';
  if (mimeType.startsWith('video/')) return 'movie';
  return 'description';
}

/** Converte uri de arquivo para base64 */
async function uriToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const MobileChatInput: React.FC<MobileChatInputProps> = ({
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
  placeholder = 'Pergunte qualquer coisa',
  bottomInset = 0,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const { theme } = useTheme();
  const c = theme.colors;

  // Pulsing scale animation for stop button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isStreaming) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isStreaming]);

  const isValid = (text.trim().length > 0 || attachments.length > 0) && !disabled;

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || disabled) return;
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setText('');
    setAttachments([]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const pickFromGallery = async () => {
    setShowAttachMenu(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Por favor conceda acesso à galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images' as any],
      allowsMultipleSelection: true,
      selectionLimit: 5 - attachments.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newAtts: MediaAttachment[] = await Promise.all(
        result.assets.map(async (asset) => ({
          name: asset.fileName || `imagem_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          base64Data: await uriToBase64(asset.uri),
          previewUrl: asset.uri,
        }))
      );
      setAttachments(prev => [...prev, ...newAtts].slice(0, 5));
    }
  };

  const pickFromCamera = async () => {
    setShowAttachMenu(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Por favor conceda acesso à câmera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      const asset = result.assets[0];
      const att: MediaAttachment = {
        name: asset.fileName || `foto_${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        base64Data: await uriToBase64(asset.uri),
        previewUrl: asset.uri,
      };
      setAttachments(prev => [...prev, att].slice(0, 5));
    }
  };

  const pickDocument = async () => {
    setShowAttachMenu(false);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'text/*', 'audio/*', 'video/*', 'application/json'],
      multiple: true,
    });
    if (!result.canceled) {
      const newAtts: MediaAttachment[] = await Promise.all(
        result.assets.map(async (asset) => ({
          name: asset.name,
          mimeType: asset.mimeType || 'application/octet-stream',
          base64Data: await uriToBase64(asset.uri),
        }))
      );
      setAttachments(prev => [...prev, ...newAtts].slice(0, 5));
    }
  };

  const attachOptions = [
    { icon: 'photo-camera' as keyof typeof MaterialIcons.glyphMap, label: 'Câmera', onPress: pickFromCamera },
    { icon: 'photo-library' as keyof typeof MaterialIcons.glyphMap, label: 'Galeria', onPress: pickFromGallery },
    { icon: 'folder-open' as keyof typeof MaterialIcons.glyphMap, label: 'Arquivo', onPress: pickDocument },
  ];

  return (
    <View style={[styles.wrapper, { backgroundColor: c.background, paddingBottom: Math.max(bottomInset, Platform.OS === 'ios' ? 8 : 12) }]}>

      {/* ── Attach Menu Modal ── */}
      <Modal
        visible={showAttachMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachMenu(false)}
        >
          <View style={[styles.menuSheet, { backgroundColor: c.surface, borderColor: c.border }]}>
            {/* Handle */}
            <View style={[styles.menuHandle, { backgroundColor: c.border }]} />

            <RNText style={[styles.menuTitle, { color: c.textSecondary, fontFamily: 'Outfit_400Regular' }]}>
              Anexar arquivo
            </RNText>

            <View style={styles.menuOptions}>
              {attachOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.menuOption, { borderColor: c.border }]}
                  onPress={opt.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconCircle, { backgroundColor: c.surfaceVariant }]}>
                    <MaterialIcons name={opt.icon} size={26} color={c.primary} />
                  </View>
                  <RNText style={[styles.menuOptionLabel, { color: c.text, fontFamily: 'Outfit_500Medium' }]}>
                    {opt.label}
                  </RNText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Preview dos anexos */}
      {attachments.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 8 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
        >
          {attachments.map((att, i) => (
            <View key={i} style={[styles.chip, { backgroundColor: c.surfaceVariant, borderColor: c.border }]}>
              {att.previewUrl ? (
                <Image source={{ uri: att.previewUrl }} style={styles.chipThumb} />
              ) : (
                <MaterialIcons name={getMimeIconName(att.mimeType)} size={16} color={c.textSecondary} />
              )}
              <RNText
                style={{ color: c.textSecondary, fontSize: 12, maxWidth: 100, fontFamily: 'Outfit_400Regular' }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {att.name}
              </RNText>
              <Pressable onPress={() => removeAttachment(i)} hitSlop={6}>
                <MaterialIcons name="close" size={14} color={c.textSecondary} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Pill container */}
      <View style={[styles.pill, { backgroundColor: c.inputBackground }]}>
        <TextInput
          style={[styles.input, { color: c.text, fontFamily: 'Outfit_400Regular' }]}
          value={text}
          onChangeText={setText}
          placeholder={attachments.length > 0 ? 'Pergunte sobre os arquivos...' : placeholder}
          placeholderTextColor={c.placeholder}
          editable={!disabled}
          multiline
          maxLength={4096}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />

        <View style={styles.actions}>
          {/* Attach button */}
          <Pressable
            style={[styles.iconBtn]}
            onPress={() => setShowAttachMenu(true)}
            disabled={disabled}
            accessibilityLabel="Anexar arquivo"
            hitSlop={6}
          >
            <MaterialIcons
              name="attach-file"
              size={24}
              color={attachments.length > 0 ? c.primary : c.textSecondary}
            />
            {attachments.length > 0 && (
              <View style={[styles.badge, { backgroundColor: c.primary }]}>
                <RNText style={styles.badgeText}>{attachments.length}</RNText>
              </View>
            )}
          </Pressable>

          {/* Send / Stop button */}
          {isStreaming ? (
            <Pressable onPress={onStop} accessibilityLabel="Parar geração" hitSlop={4}>
              <Animated.View
                style={[styles.sendBtn, { backgroundColor: c.primary, transform: [{ scale: pulseAnim }] }]}
              >
                <MaterialIcons name="stop" size={22} color="#fff" />
              </Animated.View>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSend}
              disabled={!isValid}
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: isValid ? c.primary : 'transparent', opacity: pressed ? 0.75 : 1 },
              ]}
              accessibilityLabel="Enviar mensagem"
              hitSlop={4}
            >
              <MaterialIcons name="send" size={20} color={isValid ? '#fff' : c.placeholder} style={{ marginLeft: 3 }} />
            </Pressable>
          )}
        </View>
      </View>

      <Text style={[styles.disclaimer, { color: c.placeholder, fontFamily: 'Outfit_400Regular' }]}>
        Atualmente Flavos IA pode cometer erros, reveja as respostas.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 130,
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 6,
    minHeight: 54,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 120,
    paddingVertical: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipThumb: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  // Modal / Bottom Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: 'center',
  },
  menuHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
    opacity: 0.5,
  },
  menuTitle: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  menuOptions: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    width: '100%',
  },
  menuOption: {
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  menuIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOptionLabel: {
    fontSize: 13,
  },
});

export default MobileChatInput;
