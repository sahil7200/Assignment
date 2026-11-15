import { Link, useRouter } from 'expo-router';
import { ArrowLeft, KeyRound } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Field } from '../../src/components/Controls';
import { Screen } from '../../src/components/Screen';
import { useAppStore } from '../../src/store/useAppStore';
import { themes } from '../../src/theme/tokens';

export default function OtpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  const pendingSignup = useAppStore((state) => state.pendingSignup);
  const verifyOtp = useAppStore((state) => state.verifyOtp);
  const resendOtp = useAppStore((state) => state.resendOtp);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setLoading(true);
    try {
      await verifyOtp(code.trim());
      router.replace('/(tabs)');
    } catch {
      setError(t('invalidOtp'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <Link href="/(auth)/signup" asChild><Pressable style={styles.back}><ArrowLeft size={20} color={colors.text} /><Text style={{ color: colors.text }}>{t('signup')}</Text></Pressable></Link>
      <View style={[styles.icon, { backgroundColor: colors.accent }]}><KeyRound size={25} color="#183A32" /></View>
      <Text style={[styles.title, { color: colors.text }]}>{t('otpTitle')}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t('otpSubtitle')}</Text>
      {pendingSignup ? <Text style={[styles.email, { color: colors.text }]}>{pendingSignup.user.email}</Text> : null}
      <Field label={t('otpCode')} value={code} onChangeText={setCode} keyboardType="numeric" placeholder="000000" />
      <Text style={[styles.testCode, { color: colors.primary }]}>{t('testCode')}</Text>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      <Button label={t('verify')} onPress={verify} loading={loading} />
      <Pressable onPress={() => { resendOtp(); setError(''); }} style={styles.resend}><Text style={[styles.resendText, { color: colors.primary }]}>{t('resendCode')}</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 24, gap: 18 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 30 },
  icon: { width: 54, height: 54, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Georgia', fontSize: 31, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: -10 },
  email: { fontSize: 13, fontWeight: '700' },
  testCode: { fontSize: 13, fontWeight: '700', marginTop: -8 },
  error: { fontSize: 13 },
  resend: { alignSelf: 'center', padding: 8 },
  resendText: { fontSize: 14, fontWeight: '700' },
});