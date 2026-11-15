import { Redirect, Tabs } from 'expo-router';
import { Heart, House, Settings2, ShoppingBag } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/store/useAppStore';
import { themes } from '../../src/theme/tokens';

export default function TabLayout() {
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const session = useAppStore((state) => state.session);
  const colors = themes[theme];

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { backgroundColor: colors.tab, borderTopColor: colors.border, height: 62, paddingTop: 7, paddingBottom: 7 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
    }}>
      <Tabs.Screen name="index" options={{ title: t('home'), tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }} />
      <Tabs.Screen name="cart" options={{ title: t('cart'), tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} /> }} />
      <Tabs.Screen name="favorites" options={{ title: t('favorites'), tabBarIcon: ({ color, size }) => <Heart color={color} size={size} /> }} />
      <Tabs.Screen name="settings" options={{ title: t('settings'), tabBarIcon: ({ color, size }) => <Settings2 color={color} size={size} /> }} />
    </Tabs>
  );
}