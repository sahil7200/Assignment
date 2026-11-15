import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nManager, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDatabase } from '../src/db/database';
import i18n from '../src/i18n';
import { useAppStore } from '../src/store/useAppStore';
import { themes } from '../src/theme/tokens';

export default function RootLayout() {
  const bootstrapped = useAppStore((state) => state.bootstrapped);
  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);
  const hydrate = useAppStore((state) => state.hydrate);
  const colors = themes[theme];

  useEffect(() => {
    void getDatabase().then(hydrate).catch(() => hydrate());
  }, [hydrate]);

  useEffect(() => {
    void i18n.changeLanguage(language);
    const isRTL = language === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(isRTL);
    }
  }, [language]);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        {bootstrapped ? (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="product/[id]" options={{ presentation: 'card' }} />
          </Stack>
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}