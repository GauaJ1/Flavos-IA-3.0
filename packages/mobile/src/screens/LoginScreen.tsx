// ===================================================
// Flavos IA 3.0 — LoginScreen (Firebase + Google Nativo)
// ===================================================
// Google Sign-In: usa useAuthRequest com ResponseType.IdToken
// e apenas webClientId — sem necessidade de androidClientId.
// ===================================================

import React, { useEffect, useState } from 'react';
import {
  View, TextInput, Pressable, Image, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, ResponseType, makeRedirectUri } from 'expo-auth-session';
import { useAuth, APP_CONFIG } from '@flavos/shared';
import { useTheme } from '../theme';
import type { RootStackParamList } from '../App';
import { Text } from '../components/Text';

// Necessário para fechar o browser de autenticação automaticamente no Android
WebBrowser.maybeCompleteAuthSession();

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
type FormField    = { key: string; label: string; secret: boolean; icon: string };

// Discovery document do Google OIDC
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint:         'https://oauth2.googleapis.com/token',
  revocationEndpoint:    'https://oauth2.googleapis.com/revoke',
};

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavProp>();
  const { login, register, loginWithGoogleNative, isLoading, error } = useAuth();
  const { theme }   = useTheme();
  const c           = theme.colors;
  const insets      = useSafeAreaInsets();

  const [isLogin,  setIsLogin]  = useState(true);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');

  // ── Google OAuth via useAuthRequest ──────────────────────────────────────
  // Usa apenas webClientId + ResponseType.IdToken — sem androidClientId.
  // Funciona em Expo Go e builds standalone (Android & iOS).
  const redirectUri = makeRedirectUri({ scheme: 'flavosia' });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId:     process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
      scopes:       ['openid', 'profile', 'email'],
      responseType: ResponseType.IdToken,
      usePKCE:      false,
      redirectUri,
      extraParams:  {
        // nonce obrigatório para responseType=id_token
        nonce: Math.random().toString(36).substring(2, 18),
      },
    },
    GOOGLE_DISCOVERY
  );

  // Quando o Google retorna com sucesso, autentica no Firebase
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) {
        loginWithGoogleNative(idToken)
          .then(() => navigation.replace('Chat'))
          .catch(() => {});
      }
    }
  }, [response]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isLoading) return;
    try {
      if (isLogin) await login(email, password);
      await register(email, password, name);
      navigation.replace('Chat');
    } catch { /* erro já na store */ }
  };

  const handleGoogle = async () => {
    if (isLoading || !request) return;
    await promptAsync();
  };

  const fields: FormField[] = [
    ...(!isLogin ? [{ key: 'name', label: 'Seu nome', secret: false, icon: 'person-outline' }] : []),
    { key: 'email',    label: 'Seu email',                              secret: false, icon: 'mail-outline'  },
    { key: 'password', label: isLogin ? 'Sua senha' : 'Crie uma senha', secret: true,  icon: 'lock-outline' },
  ];
  const getValue = (key: string) => key === 'name' ? name : key === 'email' ? email : password;
  const setValue = (key: string, val: string) => {
    if      (key === 'name')  setName(val);
    else if (key === 'email') setEmail(val);
    else                      setPassword(val);
  };

  return (
    <View style={[styles.flex, { backgroundColor: c.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: c.surfaceVariant, borderColor: c.border }]}>
          {/* Logo */}
          <Image source={require('../../assets/Flavos_3.png')} style={styles.logo} resizeMode="contain" />

          {/* Título gradiente */}
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
            <LinearGradient colors={['#66ff4b', '#ff5546']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientFill} />
          </MaskedView>

          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            {isLogin ? 'Faça login para continuar' : 'É rápido e fácil'}
          </Text>

          {/* Erro Firebase */}
          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: 'rgba(214,41,57,0.12)', borderColor: 'rgba(214,41,57,0.3)' }]}>
              <MaterialIcons name="error-outline" size={16} color={c.error} />
              <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
            </View>
          )}

          {/* Campos */}
          <View style={styles.form}>
            {fields.map((field) => (
              <View key={field.key} style={[styles.inputWrapper, { backgroundColor: c.background, borderColor: c.border }]}>
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

            <Pressable
              onPress={handleSubmit}
              disabled={isLoading}
              style={({ pressed }) => [styles.btn, { backgroundColor: c.primary, opacity: pressed || isLoading ? 0.75 : 1 }]}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text weight="semibold" style={styles.btnText}>{isLogin ? 'Entrar' : 'Cadastrar'}</Text>
              }
            </Pressable>
          </View>

          {/* Divisor */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
            <Text style={[styles.dividerText, { color: c.textSecondary }]}>ou</Text>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          </View>

          {/* Botão Google — requer client ID nativo (Android/iOS) no Google Cloud Console */}
          <Pressable
            disabled={true}
            style={[
              styles.googleBtn,
              { backgroundColor: c.background, borderColor: c.border, opacity: 0.45 },
            ]}
          >
            <Image
              source={{ uri: 'https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s96-fcrop64=1,00000000ffffffff-rw' }}
              style={styles.googleIcon}
              resizeMode="contain"
            />
            <Text weight="medium" style={[styles.googleText, { color: c.textSecondary }]}>
              Google (disponível em breve)
            </Text>
          </Pressable>

          {/* Alternar modo */}
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
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, paddingVertical: 40 },
  card: { width: '100%', maxWidth: 420, padding: 32, borderRadius: 28, borderWidth: 1, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  logo: { width: 110, height: 110, alignSelf: 'center', marginBottom: 20 },
  maskedContainer: { height: 44, alignSelf: 'stretch', marginBottom: 6 },
  maskWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headlineMask: { fontSize: 28, textAlign: 'center', color: 'black', lineHeight: 34 },
  gradientFill: { flex: 1 },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 12 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  form: { gap: 14 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 56, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, gap: 12 },
  input: { flex: 1, fontSize: 15, height: '100%' },
  btn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 14 },
  googleBtn: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderRadius: 16 },
  googleIcon: { width: 24, height: 24 },
  googleText: { fontSize: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, flexWrap: 'wrap' },
  switchLabel: { fontSize: 14 },
  switchAction: { fontSize: 14 },
  version: { textAlign: 'center', fontSize: 11, marginTop: 20, opacity: 0.5 },
});

export default LoginScreen;
