// ===================================================
// Flavos IA 3.0 — ChatScreen
// Mobile adaptation of packages/web/src/pages/Chat.tsx
// ===================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useChat, useAuth } from '@flavos/shared';
import { useTheme } from '../theme';

import MobileHeader from '../components/MobileHeader';
import MobileSidebar from '../components/MobileSidebar';
import MobileMessageList from '../components/MobileMessageList';
import MobileChatInput from '../components/MobileChatInput';
import { Text } from '../components/Text';

const SUGGESTIONS = [
  { text: 'Resumo das novidades em React 19', icon: 'lightbulb-outline' as const },
  { text: 'Me explique buracos negros',       icon: 'explore'           as const },
  { text: 'Projete um layout de Dashboard',   icon: 'code'              as const },
];

// ─── MobileErrorBanner ────────────────────────────────
type MobileErrType = 'rate_limit' | 'network' | 'stream' | 'backend' | 'unknown' | null;
const ERR_ICONS: Record<NonNullable<MobileErrType>, keyof typeof MaterialIcons.glyphMap> = {
  rate_limit: 'schedule',
  network:    'wifi-off',
  stream:     'sync-problem',
  backend:    'cloud-off',
  unknown:    'error-outline',
};

interface MobileErrorBannerProps {
  error: string | null;
  errorType?: MobileErrType;
  retryAfter?: number | null;
  errorColor: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

const MobileErrorBanner: React.FC<MobileErrorBannerProps> = ({
  error, errorType = 'unknown', retryAfter, errorColor, onDismiss, onRetry,
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRateLimit = errorType === 'rate_limit';
  const icon = ERR_ICONS[errorType ?? 'unknown'] ?? 'error-outline';
  const accentColor = isRateLimit ? '#ff9900' : errorColor;
  const bgColor     = isRateLimit ? 'rgba(255,153,0,0.10)' : 'rgba(214,41,57,0.12)';
  const bdColor     = isRateLimit ? 'rgba(255,153,0,0.28)' : 'rgba(214,41,57,0.28)';

  useEffect(() => {
    if (!isRateLimit || !retryAfter) return;
    setCountdown(retryAfter);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          onDismiss();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRateLimit, retryAfter]);

  if (!error) return null;

  return (
    <View style={[mebStyles.banner, { backgroundColor: bgColor, borderColor: bdColor }]}>
      <MaterialIcons name={icon} size={18} color={accentColor} style={{ flexShrink: 0 }} />
      <Text style={[mebStyles.msg, { color: accentColor, fontFamily: 'Outfit_400Regular' }]} numberOfLines={3}>
        {error}
        {isRateLimit && countdown !== null ? `  (${countdown}s)` : ''}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          hitSlop={6}
          accessibilityLabel="Tentar novamente"
          style={({ pressed }) => [mebStyles.retryBtn, { borderColor: accentColor, opacity: pressed ? 0.7 : 1 }]}
        >
          <MaterialIcons name="refresh" size={14} color={accentColor} />
        </Pressable>
      )}
      <Pressable
        onPress={onDismiss}
        hitSlop={10}
        accessibilityLabel="Fechar erro"
        style={({ pressed }) => [{ paddingLeft: 8, opacity: pressed ? 0.5 : 0.75 }]}
      >
        <MaterialIcons name="close" size={19} color={accentColor} />
      </Pressable>
    </View>
  );
};

const mebStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  msg: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  retryBtn: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 5,
    flexShrink: 0,
  },
});
// ──────────────────────────────────────────────────────


// Altura aproximada do header nativo (paddingVertical 12 * 2 + título 17 + insets)
const HEADER_HEIGHT = 56;

const ChatScreen: React.FC = () => {
  const {
    messages, isLoading, isTyping, error, errorType, retryAfter,
    sendMessage, editMessage, stopGeneration, clearMessages, clearError,
  } = useChat();
  const { user }   = useAuth();
  const { theme }  = useTheme();
  const c          = theme.colors;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const showGreeting = messages.length === 0 && !isLoading;

  // Offset para o KAV no iOS: altura do header + inset superior
  const kavOffset = HEADER_HEIGHT + insets.top;

  return (
    <View style={[styles.safeArea, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={[styles.container, { backgroundColor: c.background }]}>

        {/* Header — fora do KAV para não ser comprimido */}
        <MobileHeader onMenuPress={() => setSidebarOpen(true)} />

        {/* ── Premium Error Banner ── */}
        <MobileErrorBanner
          error={error}
          errorType={errorType}
          retryAfter={retryAfter}
          errorColor={c.error}
          onDismiss={clearError}
          onRetry={messages.length > 0 && errorType !== 'rate_limit' ? () => {
            const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
            if (lastUserMsg) { clearError(); sendMessage(lastUserMsg.content); }
          } : undefined}
        />

        {/*
          KeyboardAvoidingView — só aplica behavior no iOS.
          No Android, `windowSoftInputMode=adjustResize` cuida disso nativamente
          via app.json. O KAV no Android com `padding` causa double-offset.
        */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={kavOffset}
        >
          {/* Content Area */}
          {showGreeting ? (
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.greetingScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {/* Greeting Text */}
              <Text weight="bold" style={styles.greetingHello}>
                {`Olá${user?.displayName
                  ? ', ' + user.displayName.split(' ').slice(0, 2).join(' ')
                  : ''}!`}
              </Text>
              <Text weight="regular" style={[styles.greetingSubtitle, { color: c.textSecondary }]}>
                Como posso te ajudar?
              </Text>

              {/* Suggestion Cards */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsRow}
                style={styles.suggestionsScrollView}
                keyboardShouldPersistTaps="handled"
              >
                {SUGGESTIONS.map((sug, i) => (
                  <Pressable
                    key={i}
                    onPress={() => sendMessage(sug.text)}
                    style={({ pressed }) => [
                      styles.sugCard,
                      {
                        backgroundColor: pressed ? c.border : c.surfaceVariant,
                        borderColor: c.border,
                      },
                    ]}
                    accessibilityLabel={sug.text}
                  >
                    <Text weight="medium" style={[styles.sugText, { color: c.text }]}>
                      {sug.text}
                    </Text>
                    <MaterialIcons
                      name={sug.icon}
                      size={20}
                      color={[c.primary, '#28a745', '#ffc107'][i % 3]}
                      style={{ opacity: 0.85, marginTop: 12, alignSelf: 'flex-start' }}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </ScrollView>
          ) : (
            <MobileMessageList
              messages={messages}
              isTyping={isTyping}
              onEditMessage={editMessage}
            />
          )}

          {/* Input — dentro do KAV para subir com o teclado */}
          <MobileChatInput
            onSend={sendMessage}
            onStop={stopGeneration}
            isStreaming={messages.some(m => m.isStreaming)}
            disabled={isLoading || (isTyping && !messages.some(m => m.isStreaming))}
            bottomInset={insets.bottom}
          />
        </KeyboardAvoidingView>

        {/* Sidebar Overlay — fora do KAV (é absolute, não deve ser comprimida) */}
        <MobileSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={clearMessages}
        />
      </View>
    </View>
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
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 2,
    borderRadius: 14,
    borderWidth: 1,
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
    lineHeight: 18,
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
    paddingVertical: 24,
  },
  greetingHello: {
    fontSize: 36,
    color: '#66ff4b',
    marginBottom: 4,
    lineHeight: 42,
  },
  greetingSubtitle: {
    fontSize: 26,
    marginBottom: 32,
    lineHeight: 32,
  },
  suggestionsScrollView: {
    flexGrow: 0,
  },
  suggestionsRow: {
    paddingRight: 20,
    gap: 12,
    flexDirection: 'row',
  },
  sugCard: {
    width: 188,
    padding: 16,
    borderRadius: 16,
    minHeight: 112,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  sugText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
});

export default ChatScreen;
