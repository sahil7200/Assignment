import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react-native';
import { useCallback, useRef } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, SectionTitle } from '../../src/components/Controls';
import { Screen } from '../../src/components/Screen';
import { discountedPrice, api } from '../../src/services/api';
import { useAppStore } from '../../src/store/useAppStore';
import { themes } from '../../src/theme/tokens';
import type { CartLine } from '../../src/types';

export default function CartScreen() {
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  const cart = useAppStore((state) => state.cart);
  const session = useAppStore((state) => state.session);
  const setQuantity = useAppStore((state) => state.setQuantity);
  const removeFromCart = useAppStore((state) => state.removeFromCart);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const validateSession = useAppStore((state) => state.validateSession);
  const remoteCartId = useRef<number | null>(null);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = cart.reduce((sum, line) => sum + discountedPrice(line.product) * line.quantity, 0);

  useFocusEffect(useCallback(() => {
    if (session?.user.id) {
      void validateSession().then((freshSession) => api.userCarts(session.user.id, freshSession?.accessToken)).then((result) => {
        const firstCart = result.carts[0] as { id?: number } | undefined;
        remoteCartId.current = firstCart?.id ?? null;
      }).catch(() => undefined);
    }
  }, [session?.user.id, validateSession]));

  const updateQuantity = async (line: CartLine, quantity: number) => {
    try {
      await setQuantity(line.product, quantity);
      if (remoteCartId.current) {
        const next = useAppStore.getState().cart.map((item) => ({ id: item.product.id, quantity: item.quantity }));
        await api.updateCart(remoteCartId.current, next, useAppStore.getState().session?.accessToken).catch(() => undefined);
      }
    } catch (reason) {
      Alert.alert(t('quantity'), reason instanceof Error && reason.message === 'minimum' ? t('minError') : t('stockError'));
    }
  };

  const remove = async (line: CartLine) => {
    await removeFromCart(line.product.id);
    const remaining = useAppStore.getState().cart;
    if (remoteCartId.current) {
      if (remaining.length) await api.updateCart(remoteCartId.current, remaining.map((item) => ({ id: item.product.id, quantity: item.quantity })), useAppStore.getState().session?.accessToken).catch(() => undefined);
      else {
        await api.deleteCart(remoteCartId.current, useAppStore.getState().session?.accessToken).catch(() => undefined);
        remoteCartId.current = null;
      }
    }
  };

  const moveToFavorites = async (line: CartLine) => {
    if (!useAppStore.getState().isFavorite(line.product.id)) await toggleFavorite(line.product);
    await remove(line);
  };

  const submitCart = async () => {
    if (!session || !cart.length) return;
    try {
      const freshSession = await validateSession();
      await api.addCart(session.user.id, cart.map((line) => ({ id: line.product.id, quantity: line.quantity })), freshSession?.accessToken);
      Alert.alert(t('checkout'), t('added'));
    } catch {
      Alert.alert(t('checkout'), t('networkOffline'));
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.heading}><Text style={[styles.eyebrow, { color: colors.primary }]}>{t('brand')}</Text><Text style={[styles.title, { color: colors.text }]}>{t('cart')}</Text><Text style={[styles.subtitle, { color: colors.muted }]}>{itemCount} {t('items')}</Text></View>
      {!cart.length ? (
        <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}><ShoppingBag size={25} color={colors.primary} /></View><SectionTitle title={t('cartEmpty')} subtitle={t('cartEmptyBody')} /></View>
      ) : (
        <>
          <FlatList data={cart} keyExtractor={(item) => String(item.product.id)} contentContainerStyle={styles.list} ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
            renderItem={({ item }) => <CartRow line={item} onQuantity={(quantity) => void updateQuantity(item, quantity)} onRemove={() => void remove(item)} onMove={() => void moveToFavorites(item)} />} />
          <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: colors.muted }]}>{t('subtotal')} · {itemCount} {t('items')}</Text><Text style={[styles.summaryValue, { color: colors.text }]}>${total.toFixed(2)}</Text></View>
            <View style={[styles.summaryRow, styles.totalRow]}><Text style={[styles.totalLabel, { color: colors.text }]}>{t('total')}</Text><Text style={[styles.totalValue, { color: colors.text }]}>${total.toFixed(2)}</Text></View>
            <Button label={t('checkout')} onPress={() => void submitCart()} />
          </View>
        </>
      )}
    </Screen>
  );
}

function CartRow({ line, onQuantity, onRemove, onMove }: { line: CartLine; onQuantity: (quantity: number) => void; onRemove: () => void; onMove: () => void }) {
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  const min = line.product.minimumOrderQuantity ?? 1;
  return (
    <View style={styles.row}>
      <Image source={{ uri: line.product.thumbnail }} style={[styles.image, { backgroundColor: colors.surfaceMuted }]} contentFit="contain" />
      <View style={styles.rowMain}>
        <Text style={[styles.category, { color: colors.muted }]} numberOfLines={1}>{line.product.category}</Text>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{line.product.title}</Text>
        <View style={styles.priceLine}><Text style={[styles.price, { color: colors.text }]}>${discountedPrice(line.product).toFixed(2)}</Text><Text style={[styles.lineTotal, { color: colors.muted }]}>× {line.quantity} · ${(discountedPrice(line.product) * line.quantity).toFixed(2)}</Text></View>
        <View style={styles.actions}>
          <View style={[styles.stepper, { borderColor: colors.border }]}>
            <Pressable onPress={() => onQuantity(line.quantity - 1)} disabled={line.quantity <= min} style={styles.stepButton}><Minus size={13} color={colors.text} /></Pressable>
            <Text style={[styles.quantity, { color: colors.text }]}>{line.quantity}</Text>
            <Pressable onPress={() => onQuantity(line.quantity + 1)} disabled={line.quantity >= line.product.stock} style={styles.stepButton}><Plus size={13} color={colors.text} /></Pressable>
          </View>
          <Pressable onPress={onMove} accessibilityRole="button"><Text style={[styles.actionText, { color: colors.primary }]}>{t('moveToFavorites')}</Text></Pressable>
          <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel={t('remove')}><Trash2 size={16} color={colors.danger} /></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 10, paddingBottom: 8 },
  heading: { gap: 5, paddingBottom: 17 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontFamily: 'Georgia', fontSize: 29, fontWeight: '700' },
  subtitle: { fontSize: 12 },
  list: { paddingBottom: 12 },
  separator: { height: 1, marginVertical: 13 },
  row: { flexDirection: 'row', gap: 12, minHeight: 116 },
  image: { width: 100, height: 112, borderRadius: 3 },
  rowMain: { flex: 1, justifyContent: 'center', gap: 5 },
  category: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  productName: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  price: { fontSize: 14, fontWeight: '800' },
  priceLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  lineTotal: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, marginTop: 4 },
  stepper: { height: 31, borderWidth: 1, borderRadius: 3, flexDirection: 'row', alignItems: 'center' },
  stepButton: { width: 29, height: 29, alignItems: 'center', justifyContent: 'center' },
  quantity: { minWidth: 17, textAlign: 'center', fontSize: 12, fontWeight: '800' },
  actionText: { fontSize: 10, fontWeight: '700' },
  summary: { borderWidth: 1, padding: 14, gap: 13, borderRadius: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 13, fontWeight: '700' },
  totalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#71807844' },
  totalLabel: { fontSize: 15, fontWeight: '800' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18, paddingHorizontal: 20 },
  emptyIcon: { width: 62, height: 62, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});