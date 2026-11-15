import { useRouter } from 'expo-router';
import { Heart, Search, SlidersHorizontal } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../src/components/Controls';
import { ProductTile } from '../../src/components/ProductTile';
import { Screen } from '../../src/components/Screen';
import { useAppStore } from '../../src/store/useAppStore';
import { themes } from '../../src/theme/tokens';
import type { Product } from '../../src/types';

const PAGE_SIZE = 10;

export default function FavoritesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  const language = useAppStore((state) => state.language);
  const favorites = useAppStore((state) => state.favorites);
  const addToCart = useAppStore((state) => state.addToCart);
  const [query, setQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filtered = useMemo(() => favorites
    .filter((product) => product.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    .slice()
    .sort((a, b) => sortAscending ? a.price - b.price : b.price - a.price), [favorites, query, sortAscending]);
  const visible = filtered.slice(0, visibleCount);

  return (
    <Screen contentStyle={styles.screen}>
      <FlatList data={visible} keyExtractor={(item) => String(item.id)} numColumns={2} columnWrapperStyle={styles.columns} contentContainerStyle={styles.list}
        onEndReached={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, filtered.length))} onEndReachedThreshold={0.45}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>{t('brand')}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{t('saved')}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{favorites.length} {t('savedCount')}</Text>
            {favorites.length ? <>
              <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: language === 'ar' ? 'row-reverse' : 'row' }]}><Search size={17} color={colors.muted} /><TextInput value={query} onChangeText={(value) => { setQuery(value); setVisibleCount(PAGE_SIZE); }} placeholder={t('search')} placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.text, textAlign: language === 'ar' ? 'right' : 'left' }]} /></View>
              <Pressable onPress={() => setSortAscending((value) => !value)} style={[styles.sort, { borderColor: colors.border }]}><SlidersHorizontal size={15} color={colors.text} /><Text style={[styles.sortText, { color: colors.text }]}>{t('sort')} · {sortAscending ? t('sortPriceLow') : t('sortPriceHigh')}</Text></Pressable>
            </> : null}
          </View>
        )}
        renderItem={({ item }) => <FavoriteTile product={item} onPress={() => router.push(`/product/${item.id}`)} onAdd={() => void addToCart(item).catch(() => undefined)} />}
        ListEmptyComponent={favorites.length ? <Text style={[styles.emptySearch, { color: colors.muted }]}>{t('noResults')}</Text> : <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}><Heart size={25} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.text }]}>{t('favoritesEmpty')}</Text><Text style={[styles.emptyText, { color: colors.muted }]}>{t('favoritesEmptyBody')}</Text><Button label={t('startShopping')} onPress={() => router.replace('/(tabs)')} /></View>}
      />
    </Screen>
  );
}

function FavoriteTile({ product, onPress, onAdd }: { product: Product; onPress: () => void; onAdd: () => void }) {
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  return <View style={styles.tile}><ProductTile product={product} onPress={onPress} /><View style={styles.addButton}><Button label={t('addToCart')} variant="secondary" onPress={onAdd} disabled={product.stock <= 0} /></View></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  list: { paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1 },
  header: { gap: 7, paddingTop: 12, paddingBottom: 17 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontFamily: 'Georgia', fontSize: 29, fontWeight: '700' },
  subtitle: { fontSize: 12, marginBottom: 7 },
  search: { minHeight: 46, borderWidth: 1, borderRadius: 4, paddingHorizontal: 12, alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, height: 44, fontSize: 13 },
  sort: { minHeight: 36, borderWidth: 1, borderRadius: 3, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10 },
  sortText: { fontSize: 11, fontWeight: '700' },
  columns: { gap: 12 },
  tile: { flex: 1, marginBottom: 8 },
  addButton: { marginTop: -7, marginBottom: 10 },
  empty: { flex: 1, minHeight: 340, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 20 },
  emptyIcon: { width: 62, height: 62, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: 'Georgia', fontSize: 23, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptySearch: { paddingVertical: 25, textAlign: 'center', fontSize: 14 },
});