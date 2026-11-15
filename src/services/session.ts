import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AuthSession } from '../types';

const SESSION_KEY = 'morrow-market.session.v1';

export const sessionStorage = {
  async read(): Promise<AuthSession | null> {
    const value = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(SESSION_KEY) ?? null
      : await SecureStore.getItemAsync(SESSION_KEY);
    return value ? (JSON.parse(value) as AuthSession) : null;
  },
  async write(session: AuthSession): Promise<void> {
    const value = JSON.stringify(session);
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(SESSION_KEY, value);
      return;
    }
    await SecureStore.setItemAsync(SESSION_KEY, value);
  },
  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(SESSION_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },
};