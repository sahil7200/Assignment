import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

export function StartupScreen() {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Loading Morrow Market">
      <Image source={require('../../assets/morrow-splash.png')} style={styles.logo} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4EF' },
  logo: { width: 280, height: 75 },
});