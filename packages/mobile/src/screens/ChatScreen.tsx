// ===================================================
// Flavos IA 3.0 — ChatScreen
// Mobile adaptation of packages/web/src/pages/Chat.tsx
// ===================================================

import React, { useState } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useChat } from '@flavos/shared';
import { useTheme } from '../theme';

import MobileHeader from '../components/MobileHeader';
import MobileSidebar from '../components/MobileSidebar';
import MobileMessageList from '../components/MobileMessageList';
import MobileChatInput from '../components/MobileChatInput';
import { Text } from '../components/Text';

const SUGGESTIONS = [
  { text: 'Resumo das novidades em React 19', icon: 'lightbulb-outline' as const },
  { text: 'Me explique buracos negros', icon: 'explore' as const },
  { text: 'Projete um layout de Dashboard', icon: 'code' as const },
];

const ChatScreen: React.FC = () => {
  const { messages, isLoading, error, sendMessage, clearMessages, clearError } = useChat();
  const { theme } = useTheme();
  const c = theme.colors;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showGreeting = messages.length === 0 && !isLoading;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.container, { backgroundColor: c.background }]}>
          {/* Header */}
          <MobileHeader onMenuPress={() => setSidebarOpen(true)} />

          {/* Error Banner */}
          {!!error && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: 'rgba(214, 41, 57, 0.15)', borderBottomColor: 'rgba(214, 41, 57, 0.3)' },
              ]}
            >
              <View style={styles.errorContent}>
                <MaterialIcons name="error-outline" size={18} color={c.error} />
                <Text style={[styles.errorText, { color: c.error }]} numberOfLines={2}>
                  {error}
                </Text>
              </View>
              <Pressable
                onPress={clearError}
                hitSlop={10}
                style={({ pressed }) => [styles.errorClose, pressed && { opacity: 0.6 }]}
                accessibilityLabel="Fechar erro"
              >
                <MaterialIcons name="close" size={20} color={c.error} />
              </Pressable>
            </View>
          )}

          {/* Content Area */}
          {showGreeting ? (
            <ScrollView
              contentContainerStyle={styles.greetingScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Greeting Text */}
              <Text weight="bold" style={styles.greetingHello}>Olá</Text>
              <Text weight="regular" style={[styles.greetingSubtitle, { color: c.textSecondary }]}>
                Como posso te ajudar?
              </Text>

              {/* Suggestion Cards */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsRow}
                style={styles.suggestionsScrollView}
              >
                {SUGGESTIONS.map((sug, i) => (
                  <Pressable
                    key={i}
                    onPress={() => sendMessage(sug.text)}
                    style={({ pressed }) => [
                      styles.sugCard,
                      { backgroundColor: pressed ? c.border : c.surfaceVariant },
                    ]}
                    accessibilityLabel={sug.text}
                  >
                    <Text weight="medium" style={[styles.sugText, { color: c.text }]}>{sug.text}</Text>
                    <View style={[styles.sugIconCircle, { backgroundColor: c.background }]}>
                      <MaterialIcons name={sug.icon} size={22} color={c.text} />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </ScrollView>
          ) : (
            <MobileMessageList messages={messages} isLoading={isLoading} />
          )}

          {/* Input */}
          <MobileChatInput onSend={sendMessage} disabled={isLoading} />

          {/* Sidebar Overlay + Drawer */}
          <MobileSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onNewChat={clearMessages}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  errorClose: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
  // Greeting
  greetingScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  greetingHello: {
    fontSize: 42,
    color: '#66ff4b',
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 32,
    marginBottom: 40,
  },
  suggestionsScrollView: {
    flexGrow: 0,
  },
  suggestionsRow: {
    paddingRight: 20,
    gap: 14,
    flexDirection: 'row',
  },
  sugCard: {
    width: 200,
    padding: 18,
    borderRadius: 14,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  sugText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sugIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginTop: 12,
  },
});

export default ChatScreen;
