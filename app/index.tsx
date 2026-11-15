import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAppStore } from '../src/store/useAppStore';
import { themes } from '../src/theme/tokens';

export default function Index() {
  const session = useAppStore((state) => state.session);
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  if (!useAppStore((state) => state.bootstrapped)) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  }
  return <Redirect href={session ? '/(tabs)' : '/(auth)/login'} />;
}