// ===================================================
// Flavos IA 3.0 — Mobile App Root
// ===================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@flavos/shared';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';

export type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  const { mode } = useTheme();

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: {
              backgroundColor: mode === 'dark' ? '#0a0a0f' : '#f5f5fa',
            },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default App;
