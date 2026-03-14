// ===================================================
// Flavos IA 3.0 — MobileHeader Component
// ===================================================

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Text } from './Text';

interface MobileHeaderProps {
  onMenuPress: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuPress }) => {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.container, { backgroundColor: c.background, borderBottomColor: c.border }]}>
      <Pressable
        onPress={onMenuPress}
        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        hitSlop={10}
        accessibilityLabel="Abrir menu"
      >
        <MaterialIcons name="menu" size={28} color={c.text} />
      </Pressable>

      <Text weight="bold" style={[styles.title, { color: c.text }]}>Flavos IA</Text>

      {/* Placeholder to balance the flex row */}
      <View style={styles.iconBtn} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
});

export default MobileHeader;
