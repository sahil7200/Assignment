import { useRouter } from 'expo-router';
import { Globe2, LogOut, Moon, Sun, UserRound } from 'lucide-react-native';
import { I18nManager, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import { useTranslation } from 'react-i18next';
import { Button, SectionTitle } from '../../src/components/Controls';
import { Screen } from '../../src/components/Screen';
import { useAppStore } from '../../src/store/useAppStore';
import { themes } from '../../src/theme/tokens';
import type { AppLanguage, AppTheme } from '../../src/types';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);
  const session = useAppStore((state) => state.session);
  const setTheme = useAppStore((state) => state.setTheme);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const logout = useAppStore((state) => state.logout);
  const colors = themes[theme];
  const user = session?.user;

  const selectLanguage = async (next: AppLanguage) => {
    await setLanguage(next);
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(next === 'ar');
    await Updates.reloadAsync().catch(() => undefined);
  };
  const selectTheme = (next: AppTheme) => { void setTheme(next); };

  const signOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>{t('brand')}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{t('settingsTitle')}</Text>
      <View style={[styles.profile, { backgroundColor: colors.primary }]}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}><UserRound size={23} color="#183A32" /></View>
        <View style={styles.profileInfo}><Text style={styles.name}>{user ? `${user.firstName} ${user.lastName}` : t('profile')}</Text><Text style={styles.email}>{user?.email}</Text>{session?.demoSignup ? <Text style={styles.demo}>{t('guestSession')}</Text> : null}</View>
      </View>
      <SectionTitle title={t('preferences')} />
      <View style={[styles.settingBlock, { borderColor: colors.border }]}>
        <View style={styles.settingHeading}><View style={[styles.settingIcon, { backgroundColor: colors.surfaceMuted }]}>{theme === 'dark' ? <Moon size={17} color={colors.primary} /> : <Sun size={17} color={colors.primary} />}</View><Text style={[styles.settingTitle, { color: colors.text }]}>{t('appearance')}</Text></View>
        <View style={[styles.segment, { backgroundColor: colors.surfaceMuted }]}>
          <Choice label={t('light')} selected={theme === 'light'} onPress={() => selectTheme('light')} />
          <Choice label={t('dark')} selected={theme === 'dark'} onPress={() => selectTheme('dark')} />
        </View>
      </View>
      <View style={[styles.settingBlock, { borderColor: colors.border }]}>
        <View style={styles.settingHeading}><View style={[styles.settingIcon, { backgroundColor: colors.surfaceMuted }]}><Globe2 size={17} color={colors.primary} /></View><Text style={[styles.settingTitle, { color: colors.text }]}>{t('language')}</Text></View>
        <View style={[styles.segment, { backgroundColor: colors.surfaceMuted }]}>
          <Choice label={t('english')} selected={language === 'en'} onPress={() => void selectLanguage('en')} />
          <Choice label={t('arabic')} selected={language === 'ar'} onPress={() => void selectLanguage('ar')} />
        </View>
      </View>
      <View style={styles.accountInfo}><Text style={[styles.accountTitle, { color: colors.text }]}>{t('account')}</Text><Text style={[styles.accountDetail, { color: colors.muted }]}>{user?.username}</Text><Text style={[styles.accountDetail, { color: colors.muted }]}>{user?.email}</Text></View>
      <Button label={t('logout')} variant="danger" onPress={() => void signOut()} icon={<LogOut size={17} color="#FFFFFF" />} />
    </Screen>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  return <Text onPress={onPress} accessibilityRole="button" style={[styles.choice, { color: selected ? (theme === 'dark' ? '#14201B' : '#FFFFFF') : colors.text, backgroundColor: selected ? colors.primary : 'transparent' }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 12, gap: 18 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontFamily: 'Georgia', fontSize: 29, fontWeight: '700', marginTop: -12 },
  profile: { minHeight: 112, borderRadius: 4, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 2 },
  avatar: { width: 48, height: 48, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1, gap: 3 },
  name: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  email: { color: '#FFFFFFC7', fontSize: 12 },
  demo: { color: '#D5F36A', fontSize: 10, fontWeight: '700' },
  settingBlock: { borderBottomWidth: 1, paddingBottom: 15, gap: 12 },
  settingHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingIcon: { width: 32, height: 32, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  settingTitle: { fontSize: 14, fontWeight: '800' },
  segment: { flexDirection: 'row', borderRadius: 4, padding: 3, gap: 3 },
  choice: { flex: 1, textAlign: 'center', paddingVertical: 10, borderRadius: 3, fontSize: 12, fontWeight: '700', overflow: 'hidden' },
  accountInfo: { gap: 6, paddingTop: 2, paddingBottom: 3 },
  accountTitle: { fontSize: 13, fontWeight: '800' },
  accountDetail: { fontSize: 12 },
});