import { create } from 'zustand';
import { repository } from '../db/repository';
import { ApiError, api } from '../services/api';
import { sessionStorage } from '../services/session';
import type { AppLanguage, AppTheme, AuthSession, CartLine, Product, User } from '../types';

const isNetworkError = (error: unknown) => error instanceof ApiError && error.message === 'network';

interface AppState {
  bootstrapped: boolean;
  session: AuthSession | null;
  pendingSignup: { user: User; expiresAt: number } | null;
  theme: AppTheme;
  language: AppLanguage;
  cart: CartLine[];
  favorites: Product[];
  hydrate: () => Promise<void>;
  validateSession: () => Promise<AuthSession | null>;
  login: (username: string, password: string) => Promise<void>;
  signup: (input: { firstName: string; lastName: string; age: number; email: string; username: string; password: string }) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  resendOtp: () => void;
  logout: () => Promise<void>;
  setTheme: (theme: AppTheme) => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  setQuantity: (product: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  toggleFavorite: (product: Product) => Promise<void>;
  isFavorite: (productId: number) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  bootstrapped: false,
  session: null,
  pendingSignup: null,
  theme: 'light',
  language: 'en',
  cart: [],
  favorites: [],

  async hydrate() {
    if (get().bootstrapped) return;
    const [theme, language, cart, favorites, savedSession] = await Promise.all([
      repository.getPreference<AppTheme>('theme', 'light').catch(() => 'light' as AppTheme),
      repository.getPreference<AppLanguage>('language', 'en').catch(() => 'en' as AppLanguage),
      repository.loadCart().catch(() => []),
      repository.loadFavorites().catch(() => []),
      sessionStorage.read().catch(() => null),
    ]);

    let session = savedSession;
    if (savedSession && !savedSession.demoSignup && savedSession.accessToken) {
      try {
        const user = await api.me(savedSession.accessToken);
        session = { ...savedSession, user };
      } catch (error) {
        if (isNetworkError(error)) {
          session = savedSession;
        } else {
        try {
          if (!savedSession.refreshToken) throw new Error('No refresh token');
          const tokens = await api.refresh(savedSession.refreshToken);
          const user = await api.me(tokens.accessToken);
          session = { user, ...tokens };
          await sessionStorage.write(session);
        } catch (refreshError) {
          if (isNetworkError(refreshError)) session = savedSession;
          else {
            session = null;
            await sessionStorage.clear();
          }
        }
        }
      }
    }
    set({ theme, language, cart, favorites, session, bootstrapped: true });
  },

  async validateSession() {
    const current = get().session;
    if (!current || current.demoSignup || !current.accessToken) return current;
    try {
      const user = await api.me(current.accessToken);
      const session = { ...current, user };
      set({ session });
      return session;
    } catch (error) {
      if (isNetworkError(error)) return current;
      try {
        if (!current.refreshToken) throw new Error('No refresh token');
        const tokens = await api.refresh(current.refreshToken);
        const user = await api.me(tokens.accessToken);
        const session: AuthSession = { user, ...tokens };
        await sessionStorage.write(session);
        set({ session });
        return session;
      } catch (refreshError) {
        if (isNetworkError(refreshError)) return current;
        await sessionStorage.clear();
        set({ session: null });
        return null;
      }
    }
  },

  async login(username, password) {
    const result = await api.login(username, password);
    const session: AuthSession = {
      user: result,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
    await sessionStorage.write(session);
    set({ session, pendingSignup: null });
  },

  async signup(input) {
    const user = await api.signup(input);
    set({ pendingSignup: { user, expiresAt: Date.now() + 5 * 60 * 1000 } });
  },

  async verifyOtp(code) {
    const pending = get().pendingSignup;
    if (!pending || Date.now() > pending.expiresAt || code !== '123456') throw new Error('otp');
    const session: AuthSession = { user: pending.user, accessToken: null, refreshToken: null, demoSignup: true };
    await sessionStorage.write(session);
    set({ session, pendingSignup: null });
  },

  resendOtp() {
    const pending = get().pendingSignup;
    if (pending) set({ pendingSignup: { ...pending, expiresAt: Date.now() + 5 * 60 * 1000 } });
  },

  async logout() {
    await sessionStorage.clear();
    set({ session: null, pendingSignup: null });
  },

  async setTheme(theme) {
    await repository.setPreference('theme', theme);
    set({ theme });
  },

  async setLanguage(language) {
    await repository.setPreference('language', language);
    set({ language });
  },

  async addToCart(product, quantity = product.minimumOrderQuantity ?? 1) {
    const minimum = product.minimumOrderQuantity ?? 1;
    if (quantity < minimum) throw new Error('minimum');
    if (product.stock <= 0 || quantity > product.stock) throw new Error('stock');
    const existing = get().cart.find((line) => line.product.id === product.id);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity > product.stock) throw new Error('stock');
    await repository.saveCartLine(product, nextQuantity);
    const cart = existing
      ? get().cart.map((line) => line.product.id === product.id ? { product, quantity: nextQuantity } : line)
      : [...get().cart, { product, quantity: nextQuantity }];
    set({ cart });
  },

  async setQuantity(product, quantity) {
    const minimum = product.minimumOrderQuantity ?? 1;
    if (quantity < minimum) throw new Error('minimum');
    if (quantity > product.stock) throw new Error('stock');
    await repository.saveCartLine(product, quantity);
    set({ cart: get().cart.map((line) => line.product.id === product.id ? { product, quantity } : line) });
  },

  async removeFromCart(productId) {
    const line = get().cart.find((item) => item.product.id === productId);
    if (line) await repository.saveCartLine(line.product, 0);
    set({ cart: get().cart.filter((item) => item.product.id !== productId) });
  },

  async toggleFavorite(product) {
    const exists = get().favorites.some((item) => item.id === product.id);
    await repository.saveFavorite(product, !exists);
    set({ favorites: exists ? get().favorites.filter((item) => item.id !== product.id) : [...get().favorites, product] });
  },

  isFavorite(productId) {
    return get().favorites.some((item) => item.id === productId);
  },
}));