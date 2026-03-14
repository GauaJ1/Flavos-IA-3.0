// ===================================================
// Flavos IA 3.0 — LoginScreen
// Mobile adaptation of packages/web/src/pages/Home.tsx
// ===================================================

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth, APP_CONFIG } from '@flavos/shared';
import { useTheme } from '../theme';
import type { RootStackParamList } from '../App';
import { Text } from '../components/Text';

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

type FormField = { key: string; label: string; secret: boolean; icon: string };

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavProp>();
  const { login, isLoading } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    if (isLoading) return;
    try {
      await login(email, password);
      navigation.replace('Chat');
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogle = () => {
    // TODO: Firebase Google Auth
    navigation.replace('Chat');
  };

  const fields: FormField[] = [
    ...(!isLogin ? [{ key: 'name', label: 'Seu nome', secret: false, icon: 'person-outline' }] : []),
    { key: 'email', label: 'Seu email', secret: false, icon: 'mail-outline' },
    { key: 'password', label: isLogin ? 'Sua senha' : 'Crie uma senha', secret: true, icon: 'lock-outline' },
  ];

  const getValue = (key: string) => {
    if (key === 'name') return name;
    if (key === 'email') return email;
    return password;
  };
  const setValue = (key: string, val: string) => {
    if (key === 'name') setName(val);
    else if (key === 'email') setEmail(val);
    else setPassword(val);
  };

  return (
    <View style={[styles.flex, { backgroundColor: c.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: c.surfaceVariant,
              borderColor: c.border,
              shadowColor: c.shadow,
            },
          ]}
        >
          {/* Logo */}
          <Image
            source={require('../../assets/Flavos_3.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Gradient-style headline */}
          <MaskedView
            style={styles.maskedContainer}
            maskElement={
              <View style={styles.maskWrapper}>
                <Text weight="bold" style={styles.headlineMask}>
                  {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
                </Text>
              </View>
            }
          >
            <LinearGradient
              colors={['#66ff4b', '#ff5546']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientFill}
            />
          </MaskedView>

          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            {isLogin ? 'Faça login para continuar' : 'É rápido e fácil'}
          </Text>

          {/* Form Fields */}
          <View style={styles.form}>
            {fields.map((field) => (
              <View
                key={field.key}
                style={[
                  styles.inputWrapper,
                  { backgroundColor: c.background, borderColor: c.border },
                ]}
              >
                <MaterialIcons name={field.icon as any} size={22} color={c.textSecondary} />
                <TextInput
                  style={[styles.input, { color: c.text }]}
                  placeholder={field.label}
                  placeholderTextColor={c.placeholder}
                  value={getValue(field.key)}
                  onChangeText={(v) => setValue(field.key, v)}
                  secureTextEntry={field.secret}
                  autoCapitalize="none"
                  keyboardType={field.key === 'email' ? 'email-address' : 'default'}
                  returnKeyType={field.key === 'password' ? 'done' : 'next'}
                  onSubmitEditing={field.key === 'password' ? handleSubmit : undefined}
                />
              </View>
            ))}

            {/* CTA Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: c.primary, opacity: pressed || isLoading ? 0.75 : 1 },
              ]}
              accessibilityLabel={isLogin ? 'Entrar' : 'Cadastrar'}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text weight="semibold" style={styles.btnText}>{isLogin ? 'Entrar' : 'Cadastrar'}</Text>
              }
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
            <Text style={[styles.dividerText, { color: c.textSecondary }]}>ou</Text>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          </View>

          {/* Google Button */}
          <Pressable
            onPress={handleGoogle}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.googleBtn,
              {
                backgroundColor: c.background,
                borderColor: c.border,
                opacity: pressed || isLoading ? 0.7 : 1,
              },
            ]}
            accessibilityLabel={isLogin ? 'Entrar com o Google' : 'Cadastrar com o Google'}
          >
            <Image
              source={{ uri: 'https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s96-fcrop64=1,00000000ffffffff-rw' }}
              style={styles.googleIcon}
              resizeMode="contain"
            />
            <Text weight="medium" style={[styles.googleText, { color: c.text }]}>
              {isLogin ? 'Entrar com o Google' : 'Cadastrar com o Google'}
            </Text>
          </Pressable>

          {/* Switch mode */}
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: c.placeholder }]}>
              {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
            </Text>
            <Pressable onPress={() => setIsLogin(!isLogin)}>
              <Text weight="semibold" style={[styles.switchAction, { color: c.primary }]}>
                {isLogin ? 'Cadastre-se' : 'Faça login'}
              </Text>
            </Pressable>
          </View>

          {/* Version */}
          <Text style={[styles.version, { color: c.placeholder }]}>
            v{APP_CONFIG.APP_VERSION} • {APP_CONFIG.APP_NAME}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 32,
    borderRadius: 28,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 110,
    height: 110,
    alignSelf: 'center',
    marginBottom: 20,
  },
  maskedContainer: {
    height: 44, // Fixed height to fit the headline exactly
    alignSelf: 'stretch',
    marginBottom: 6,
  },
  maskWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headlineMask: {
    fontSize: 28,
    textAlign: 'center',
    color: 'black',
    lineHeight: 34,
  },
  gradientFill: {
    flex: 1,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  btn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
  },
  googleBtn: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleText: {
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  switchLabel: {
    fontSize: 14,
  },
  switchAction: {
    fontSize: 14,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 20,
    opacity: 0.5,
  },
});

export default LoginScreen;
