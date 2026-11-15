import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { themes } from '../theme/tokens';

export function Screen({ children, scroll = false, contentStyle }: { children: ReactNode; scroll?: boolean; contentStyle?: object }) {
  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);
  const colors = themes[theme];
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.content, { direction }, contentStyle]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { direction }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 24 },
});