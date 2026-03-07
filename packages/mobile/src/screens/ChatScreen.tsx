// ===================================================
// Flavos IA 3.0 — Mobile Chat Screen
// ===================================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat, useTheme, formatTimestamp } from '@flavos/shared';
import type { Message } from '@flavos/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type ChatScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>;
};

/**
 * Componente de bolha de mensagem para mobile.
 */
const MessageBubble: React.FC<{
  message: Message;
  colors: any;
}> = ({ message, colors }) => {
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.bubbleRow,
        { justifyContent: isUser ? 'flex-end' : 'flex-start' },
      ]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>F</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.userBubble : colors.aiBubble,
            borderBottomRightRadius: isUser ? 4 : 18,
            borderBottomLeftRadius: isUser ? 18 : 4,
          },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            {
              color: isUser ? colors.userBubbleText : colors.aiBubbleText,
            },
          ]}
        >
          {message.content}
        </Text>
        <Text
          style={[
            styles.timestamp,
            { textAlign: isUser ? 'right' : 'left' },
          ]}
        >
          {formatTimestamp(message.timestamp)}
        </Text>
      </View>
    </View>
  );
};

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation }) => {
  const { messages, isLoading, error, sendMessage, clearMessages, clearError } =
    useChat();
  const { mode, toggleTheme, theme } = useTheme();
  const colors = theme.colors;

  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed);
    setText('');
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} colors={colors} />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.headerBtn,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: colors.text, fontSize: 16 }}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>F</Text>
          </View>

          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Flavos IA
            </Text>
            <Text
              style={{ fontSize: 11, color: isLoading ? '#7c5cfc' : colors.textSecondary }}
            >
              {isLoading ? 'Digitando...' : 'Gemini 3.1-flash • Online'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={clearMessages}
            style={[
              styles.headerBtn,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 14 }}>🗑️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[
              styles.headerBtn,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 14 }}>
              {mode === 'dark' ? '☀️' : '🌙'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Comece uma conversa com a IA!
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Powered by Gemini 3.1-flash
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}

        {isLoading && (
          <View style={[styles.bubbleRow, { justifyContent: 'flex-start' }]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>F</Text>
            </View>
            <View
              style={[styles.bubble, { backgroundColor: colors.aiBubble }]}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                Pensando...
              </Text>
            </View>
          </View>
        )}

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={colors.placeholder}
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={isLoading || !text.trim()}
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  isLoading || !text.trim() ? colors.border : '#7c5cfc',
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#7c5cfc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 107, 0.3)',
  },
  errorText: { color: '#ff6b6b', fontSize: 13, flex: 1 },
  errorDismiss: { color: '#ff6b6b', fontSize: 16, paddingLeft: 10 },
  chatArea: { flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16 },
  emptySubtext: { fontSize: 13, marginTop: 8, opacity: 0.7 },
  messageList: { paddingVertical: 16 },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7c5cfc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  bubble: {
    maxWidth: '75%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  timestamp: { fontSize: 11, opacity: 0.6, marginTop: 6 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { fontSize: 18, color: '#fff' },
});

export default ChatScreen;
