import { Link, useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Field } from '../../src/components/Controls';
import { Screen } from '../../src/components/Screen';
import { ApiError } from '../../src/services/api';
import { useAppStore } from '../../src/store/useAppStore';
import { themes } from '../../src/theme/tokens';

export default function SignupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  const signup = useAppStore((state) => state.signup);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createAccount = async () => {
    if (![firstName, lastName, email, age, username, password, confirmPassword].every((value) => value.trim())) { setError(t('required')); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError(t('invalidEmail')); return; }
    if (!Number.isInteger(Number(age)) || Number(age) < 13) { setError(t('invalidAge')); return; }
    if (password !== confirmPassword) { setError(t('passwordMismatch')); return; }
    setError('');
    setLoading(true);
    try {
      await signup({ firstName, lastName, email, age: Number(age), username, password });
      router.push('/(auth)/otp');
    } catch (reason) {
      setError(reason instanceof ApiError && reason.message === 'network' ? t('networkOffline') : t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.topline}><Text style={[styles.brand, { color: colors.primary }]}>{t('brand')}</Text><Text style={[styles.step, { color: colors.muted }]}>01 / 02</Text></View>
      <Text style={[styles.title, { color: colors.text }]}>{t('signup')}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t('signupSubtitle')}</Text>
      <View style={styles.fields}>
        <Field label={t('firstName')} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
        <Field label={t('lastName')} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
        <Field label={t('email')} value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field label={t('age')} value={age} onChangeText={setAge} keyboardType="numeric" />
        <Field label={t('username')} value={username} onChangeText={setUsername} />
        <Field label={t('password')} value={password} onChangeText={setPassword} secureTextEntry />
        <Field label={t('confirmPassword')} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      <Button label={t('continue')} onPress={createAccount} loading={loading} icon={<ArrowRight size={17} color={theme === 'dark' ? '#14201B' : '#FFFFFF'} />} />
      <View style={styles.footer}><Text style={{ color: colors.muted }}>{t('alreadyAccount')}</Text><Link href="/(auth)/login" style={[styles.link, { color: colors.primary }]}>{t('signIn')}</Link></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, gap: 16 },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  brand: { fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  step: { fontSize: 11, fontWeight: '700' },
  title: { fontFamily: 'Georgia', fontSize: 30, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: -10 },
  fields: { gap: 12 },
  error: { fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 6 },
  link: { fontSize: 14, fontWeight: '800' },
});