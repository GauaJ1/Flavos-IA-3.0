// ===================================================
// Flavos IA 3.0 — App.tsx (Mobile)
// React Navigation Stack: Login → Chat
// ===================================================

import React from 'react';
import { StatusBar } from 'expo-status-bar';
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
