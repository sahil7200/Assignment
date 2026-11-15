import { Redirect, Stack, useSegments } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import { themes } from '../../src/theme/tokens';

export default function AuthLayout() {
  const theme = useAppStore((state) => state.theme);
  const session = useAppStore((state) => state.session);
  const pendingSignup = useAppStore((state) => state.pendingSignup);
  const segments = useSegments();
  const onOtp = segments.includes('otp');

  if (session && !onOtp) return <Redirect href="/(tabs)" />;
  if (!session && onOtp && !pendingSignup) return <Redirect href="/(auth)/login" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: themes[theme].background } }} />;
}