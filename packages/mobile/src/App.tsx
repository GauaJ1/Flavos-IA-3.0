// ===================================================
// Flavos IA 3.0 — App.tsx (Mobile)
// React Navigation Stack: Login → Chat
// Firebase inicializado aqui (equivalente ao web main.tsx)
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
import { aiService, initFirebase, useAuth } from '@flavos/shared';

// Firebase SDK — inicializado ANTES de qualquer componente usar useAuth/useChat
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Singleton — evita re-inicialização em hot-reload do Expo
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Se o app acabou de ser criado (primeira vez), inicializa Auth com persistência.
// Em hot-reloads, getAuth() retorna a instância já existente.
const firebaseAuth = getApps().length > 1
  ? getAuth(firebaseApp)
  : initializeAuth(firebaseApp, {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      persistence: require('firebase/auth').getReactNativePersistence(AsyncStorage),
    });

const firebaseDb = getFirestore(firebaseApp);

// Registra as instâncias no shared package (mesmo padrão do web)
initFirebase(firebaseAuth, firebaseDb);

import LoginScreen from './screens/LoginScreen';
import ChatScreen  from './screens/ChatScreen';

export type RootStackParamList = {
  Login: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { theme, mode } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const c = theme.colors;

  // Aguarda Firebase verificar sessão antes de renderizar
  if (isLoading) return null;

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} backgroundColor={c.background} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isAuthenticated ? 'Chat' : 'Login'}
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Chat"  component={ChatScreen}  />
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

  const [themeLoaded, setThemeLoaded] = React.useState(false);
  const setMode = useTheme(state => state.setMode);

  React.useEffect(() => {
    aiService.setBaseUrl(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001');

    AsyncStorage.getItem('flavos_theme_mode')
      .then((saved) => {
        if (saved === 'dark' || saved === 'light') setMode(saved);
      })
      .finally(() => setThemeLoaded(true));
  }, [setMode]);

  if (!fontsLoaded || !themeLoaded) return null;

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
