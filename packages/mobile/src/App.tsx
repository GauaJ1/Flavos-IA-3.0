// ===================================================
// Flavos IA 3.0 — App.tsx (Mobile)
// React Navigation Stack: Login → Chat
// ===================================================

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  useFonts,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { useTheme } from './theme';
import { aiService } from '@flavos/shared';

import LoginScreen from './screens/LoginScreen';
import ChatScreen from './screens/ChatScreen';

export type RootStackParamList = {
  Login: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { theme, mode } = useTheme();
  const c = theme.colors;

  const flashOpacity = React.useRef(new Animated.Value(0)).current;
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Crossfade: fade in the new background color, then fade out
    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mode]);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} backgroundColor={c.background} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Theme crossfade flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: c.background,
          opacity: flashOpacity,
          zIndex: 9999,
        }}
      />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  // Configura a URL do backend explicitamente quando o App monta.
  // Isso sobrepõe qualquer problema do Expo não ter carregado o .env corretamente.
  React.useEffect(() => {
    aiService.setBaseUrl('http://192.168.0.203:3001');
    console.log('[MobileApp] Backend URL configurada para: http://192.168.0.203:3001');
  }, []);

  if (!fontsLoaded) {
    return null; // O Expo cuida da SplashScreen nativamente enquanto carrega
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
