import { Link, useRouter } from 'expo-router';
import { ArrowRight, Eye, EyeOff, ShoppingBag } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Field } from '../../src/components/Controls';
import { Screen } from '../../src/components/Screen';
import { ApiError } from '../../src/services/api';
import { useAppStore } from '../../src/store/useAppStore';
import { themes } from '../../src/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  const login = useAppStore((state) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const signIn = async () => {
    if (!username.trim() || !password) { setError(t('required')); return; }
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      router.replace('/(tabs)');
    } catch (reason) {
      setError(reason instanceof ApiError && reason.message === 'network' ? t('networkOffline') : reason instanceof ApiError && reason.status >= 500 ? t('serverError') : t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.brandRow}>
        <View style={[styles.brandMark, { backgroundColor: colors.accent }]}><ShoppingBag size={19} color="#183A32" /></View>
        <Text style={[styles.brand, { color: colors.text }]}>{t('brand')}</Text>
      </View>
      <View style={[styles.heroBand, { backgroundColor: colors.primary }]}>
        <Text style={styles.heroEyebrow}>{t('heroEyebrow')}</Text>
        <Text style={styles.heroText}>{t('heroTitle')}</Text>
        <View style={[styles.heroRule, { backgroundColor: colors.accent }]} />
      </View>
      <View style={styles.form}>
        <Text style={[styles.title, { color: colors.text }]}>{t('login')}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{t('loginSubtitle')}</Text>
        <Field label={t('emailOrUsername')} value={username} onChangeText={setUsername} autoCapitalize="none" />
        <Field label={t('password')} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} trailing={(
            <Pressable onPress={() => setShowPassword(!showPassword)} accessibilityLabel={showPassword ? t('hidePassword') : t('showPassword')}>
            {showPassword ? <EyeOff size={19} color={colors.muted} /> : <Eye size={19} color={colors.muted} />}
          </Pressable>
        )} />
        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
        <Button label={loading ? t('signingIn') : t('signIn')} onPress={signIn} loading={loading} icon={<ArrowRight size={17} color={theme === 'dark' ? '#14201B' : '#FFFFFF'} />} />
        <Pressable onPress={() => { setUsername('emilys'); setPassword('emilyspass'); }} style={styles.demoLink}>
          <Text style={[styles.demoText, { color: colors.primary }]}>{t('demoLogin')}</Text>
        </Pressable>
        <View style={styles.footer}>
          <Text style={{ color: colors.muted }}>{t('noAccount')}</Text>
          <Link href="/(auth)/signup" style={[styles.link, { color: colors.primary }]}>{t('createAccount')}</Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, gap: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 36, height: 36, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  heroBand: { minHeight: 178, padding: 22, justifyContent: 'center', borderRadius: 4, overflow: 'hidden' },
  heroEyebrow: { color: '#D5F36A', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },
  heroText: { color: '#FFFFFF', fontFamily: 'Georgia', fontSize: 30, lineHeight: 35, fontWeight: '700' },
  heroRule: { width: 46, height: 3, marginTop: 16 },
  form: { gap: 15 },
  title: { fontFamily: 'Georgia', fontSize: 29, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: -8, marginBottom: 3 },
  error: { fontSize: 13 },
  demoLink: { alignSelf: 'center', paddingVertical: 5 },
  demoText: { fontSize: 13, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 5 },
  link: { fontSize: 14, fontWeight: '800' },
});