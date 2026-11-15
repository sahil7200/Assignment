import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { themes } from '../theme/tokens';

export function Button({ label, onPress, variant = 'primary', loading, disabled, icon }: {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; loading?: boolean; disabled?: boolean; icon?: ReactNode;
}) {
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  const backgroundColor = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.surfaceMuted : 'transparent';
  const color = variant === 'primary' || variant === 'danger' ? (theme === 'dark' ? '#14201B' : '#FFFFFF') : colors.text;

  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [styles.button, { backgroundColor, opacity: disabled ? 0.45 : pressed ? 0.82 : 1 }, variant === 'quiet' && styles.quiet]}>
      {loading ? <ActivityIndicator color={color} /> : <View style={styles.buttonInner}>{icon}{<Text style={[styles.buttonText, { color }]}>{label}</Text>}</View>}
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize = 'none', error, trailing }: {
  label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric'; autoCapitalize?: 'none' | 'sentences' | 'words'; error?: string; trailing?: ReactNode;
}) {
  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);
  const colors = themes[theme];
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.text, textAlign: language === 'ar' ? 'right' : 'left' }]}>{label}</Text>
      <View style={[styles.inputShell, { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border, flexDirection: language === 'ar' ? 'row-reverse' : 'row' }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? label}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          style={[styles.input, { color: colors.text, textAlign: language === 'ar' ? 'right' : 'left' }]}
        />
        {trailing}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  return (
    <View style={styles.sectionTitle}>
      <Text style={[styles.sectionHeading, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 54, borderRadius: 4, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  quiet: { borderWidth: 1, borderColor: '#71807855' },
  buttonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  fieldWrap: { gap: 7 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  inputShell: { minHeight: 52, borderWidth: 1, borderRadius: 4, alignItems: 'center', paddingHorizontal: 14 },
  input: { flex: 1, minHeight: 50, fontSize: 15 },
  error: { fontSize: 12 },
  sectionTitle: { gap: 5 },
  sectionHeading: { fontSize: 21, fontFamily: 'Georgia', fontWeight: '700' },
  subtitle: { fontSize: 13, lineHeight: 20 },
});