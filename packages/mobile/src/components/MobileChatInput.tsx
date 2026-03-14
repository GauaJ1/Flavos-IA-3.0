// ===================================================
// Flavos IA 3.0 — MobileChatInput Component
// ===================================================

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Text } from './Text';

interface MobileChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  bottomInset?: number;
}

const MobileChatInput: React.FC<MobileChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Pergunte qualquer coisa',
  bottomInset = 0,
}) => {
  const [text, setText] = useState('');
  const { theme } = useTheme();
  const c = theme.colors;

  const isValid = text.trim().length > 0 && !disabled;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: c.background, paddingBottom: Math.max(bottomInset, Platform.OS === 'ios' ? 8 : 12) }]}>
      {/* Pill container */}
      <View style={[styles.pill, { backgroundColor: c.inputBackground }]}>
        <TextInput
          style={[styles.input, { color: c.text }]}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={c.placeholder}
          editable={!disabled}
          multiline
          maxLength={4096}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />

        <View style={styles.actions}>
          {/* Attach icon (decorative) */}
          <Pressable
            style={[styles.iconBtn]}
            accessibilityLabel="Anexar arquivo"
            hitSlop={6}
          >
            <MaterialIcons name="attach-file" size={24} color={c.textSecondary} />
          </Pressable>

          {/* Send button */}
          <Pressable
            onPress={handleSend}
            disabled={!isValid}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: isValid ? c.primary : 'transparent',
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            accessibilityLabel="Enviar mensagem"
            hitSlop={4}
          >
            <MaterialIcons
              name="send"
              size={20}
              color={isValid ? '#fff' : c.placeholder}
              style={{ marginLeft: 3 }}
            />
          </Pressable>
        </View>
      </View>

      <Text style={[styles.disclaimer, { color: c.placeholder }]}>
        Atualmente Flavos IA pode cometer erros, reveja as respostas.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    // paddingBottom is injected dynamically via bottomInset prop
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
});

export default MobileChatInput;
