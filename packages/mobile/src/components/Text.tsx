import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

export interface TextProps extends RNTextProps {
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
}

/**
 * Custom Text component that uses the Outfit font globally.
 */
export const Text: React.FC<TextProps> = ({ style, weight = 'regular', ...props }) => {
  const getFontFamily = () => {
    // If the style object explicitly has a fontWeight, we map it to the correct Outfit font variant.
    // However, it's safer to use the 'weight' prop.
    switch (weight) {
      case 'light':
        return 'Outfit_300Light';
      case 'medium':
        return 'Outfit_500Medium';
      case 'semibold':
        return 'Outfit_600SemiBold';
      case 'bold':
        return 'Outfit_700Bold';
      case 'regular':
      default:
        return 'Outfit_400Regular';
    }
  };

  return (
    <RNText
      {...props}
      style={[styles.defaultText, { fontFamily: getFontFamily() }, style]}
    />
  );
};

const styles = StyleSheet.create({
  defaultText: {}, // Base resets if needed
});
