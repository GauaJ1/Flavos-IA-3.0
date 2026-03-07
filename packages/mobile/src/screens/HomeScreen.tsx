// ===================================================
// Flavos IA 3.0 — Mobile Home Screen
// ===================================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, APP_CONFIG } from '@flavos/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { mode, toggleTheme, theme } = useTheme();
  const colors = theme.colors;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Theme toggle */}
      <TouchableOpacity
        onPress={toggleTheme}
        style={[
          styles.themeToggle,
          {
            backgroundColor: colors.surfaceVariant,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={styles.themeIcon}>
          {mode === 'dark' ? '☀️' : '🌙'}
        </Text>
      </TouchableOpacity>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>F</Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {APP_CONFIG.APP_NAME}
      </Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Seu assistente de IA inteligente
      </Text>

      <Text style={[styles.version, { color: colors.textSecondary }]}>
        Powered by Gemini 3.1-flash • v{APP_CONFIG.APP_VERSION}
      </Text>

      {/* CTA */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Chat')}
        style={styles.ctaButton}
        activeOpacity={0.8}
      >
        <Text style={styles.ctaText}>💬 Iniciar Chat</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={[styles.footer, { color: colors.textSecondary }]}>
        Protótipo 1.0 — Sem autenticação
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  themeToggle: {
    position: 'absolute',
    top: 60,
    right: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  themeIcon: {
    fontSize: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: '#7c5cfc',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  version: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 40,
    textAlign: 'center',
  },
  ctaButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    backgroundColor: '#7c5cfc',
    shadowColor: '#7c5cfc',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    fontSize: 12,
    opacity: 0.5,
  },
});

export default HomeScreen;
