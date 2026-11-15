import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Search, SlidersHorizontal, WifiOff } from 'lucide-react-native';
import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Network from 'expo-network';
import { ProductTile } from '../../src/components/ProductTile';
import { Screen } from '../../src/components/Screen';
import { api } from '../../src/services/api';
import { repository } from '../../src/db/repository';
import { useAppStore } from '../../src/store/useAppStore';
import { themes } from '../../src/theme/tokens';
import type { Category, Product } from '../../src/types';

type SortMode = 'recommended' | 'price-asc' | 'price-desc' | 'rating';
const PAGE_SIZE = 10;

export default function CatalogScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  const language = useAppStore((state) => state.language);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [total, setTotal] = useState(0);
  const listRef = useRef<FlatList<Product>>(null);
  const requestId = useRef(0);
  const categoriesForSort = useCallback((items: Category[]) => items, []);

  useFocusEffect(useCallback(() => {
    void api.categories().then((items) => setCategories(categoriesForSort(items))).catch(() => undefined);
  }, [categoriesForSort]));

  const sortBy = sortMode === 'price-asc' || sortMode === 'price-desc' ? 'price' : sortMode === 'rating' ? 'rating' : undefined;
  const sortOrder = sortMode === 'price-desc' || sortMode === 'rating' ? 'desc' : 'asc';

  const fetchPage = useCallback(async (skip: number, append: boolean, activeRequest: number) => {
    try {
      const page = await api.products({ skip, limit: PAGE_SIZE, query: deferredSearch, category, sortBy, order: sortOrder });
      if (activeRequest !== requestId.current) return;
      setProducts((current) => append ? [...current, ...page.products] : page.products);
      setTotal(page.total);
      setOffline(false);
      setError('');
      await repository.cacheProducts(page.products);
    } catch {
      if (activeRequest !== requestId.current) return;
      setOffline(true);
      const cached = await repository.loadCachedProducts().catch(() => []);
      const filtered = cached.filter((product) => {
        const matchesQuery = !deferredSearch || product.title.toLocaleLowerCase().includes(deferredSearch.toLocaleLowerCase());
        const matchesCategory = !category || product.category === category;
        return matchesQuery && matchesCategory;
      });
      setProducts((current) => append ? current : filtered);
      setTotal(filtered.length);
      setError(filtered.length ? '' : t('loadError'));
    } finally {
      if (activeRequest === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [category, deferredSearch, sortBy, sortOrder, t]);

  useEffect(() => {
    const activeRequest = ++requestId.current;
    setLoading(true);
    setProducts([]);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    void fetchPage(0, false, activeRequest);
  }, [fetchPage]);

  useEffect(() => {
    const subscription = Network.addNetworkStateListener((state) => {
      if (state.isConnected && offline) {
        const activeRequest = ++requestId.current;
        setLoading(true);
        setError('');
        void fetchPage(0, false, activeRequest);
      }
    });
    return () => subscription.remove();
  }, [fetchPage, offline]);

  const loadMore = () => {
    if (loading || loadingMore || products.length >= total || error) return;
    setLoadingMore(true);
    void fetchPage(products.length, true, requestId.current);
  };

  const cycleSort = () => setSortMode((mode) => mode === 'recommended' ? 'price-asc' : mode === 'price-asc' ? 'price-desc' : mode === 'price-desc' ? 'rating' : 'recommended');
  const sortLabel = sortMode === 'price-asc' ? t('sortPriceLow') : sortMode === 'price-desc' ? t('sortPriceHigh') : sortMode === 'rating' ? t('sortRating') : t('sortDefault');

  return (
    <Screen contentStyle={styles.screen}>
      <FlatList
        ref={listRef}
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.45}
        ListHeaderComponent={(
          <View style={styles.header}>
            <View style={styles.brandLine}>
              <View><Text style={[styles.eyebrow, { color: colors.primary }]}>{t('brand')}</Text><Text style={[styles.heading, { color: colors.text }]}>{t('featured')}</Text></View>
              <Pressable onPress={() => router.push('/(tabs)/settings')} style={[styles.avatar, { backgroundColor: colors.accent }]}><Text style={styles.avatarText}>{language === 'ar' ? 'م' : 'M'}</Text></Pressable>
            </View>
            <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: language === 'ar' ? 'row-reverse' : 'row' }]}>
              <Search size={18} color={colors.muted} />
              <TextInput value={search} onChangeText={setSearch} placeholder={t('search')} placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.text, textAlign: language === 'ar' ? 'right' : 'left' }]} returnKeyType="search" />
            </View>
            {offline ? <View style={[styles.offline, { backgroundColor: colors.surfaceMuted }]}><WifiOff size={15} color={colors.muted} /><Text style={[styles.offlineText, { color: colors.muted }]}>{t('networkOffline')}</Text></View> : null}
            <View style={styles.sectionLine}><Text style={[styles.sectionLabel, { color: colors.text }]}>{t('categories')}</Text><ChevronRight size={17} color={colors.muted} /></View>
            <FlatList horizontal data={[{ slug: '', name: t('all'), url: '' }, ...categories]} keyExtractor={(item) => item.slug || 'all'} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => <Pressable onPress={() => setCategory(item.slug)} style={[styles.categoryChip, { backgroundColor: category === item.slug ? colors.primary : colors.surface, borderColor: category === item.slug ? colors.primary : colors.border }]}><Text style={[styles.categoryText, { color: category === item.slug ? '#FFFFFF' : colors.text }]}>{item.name}</Text></Pressable>} />
            <View style={styles.sortLine}>
              <Text style={[styles.resultCount, { color: colors.muted }]}>{loading ? ' ' : `${total} ${t('items')}`}</Text>
              <Pressable onPress={cycleSort} style={[styles.sortControl, { borderColor: colors.border }]}><SlidersHorizontal size={15} color={colors.text} /><Text style={[styles.sortText, { color: colors.text }]} numberOfLines={1}>{sortLabel}</Text></Pressable>
            </View>
            {error ? <View style={styles.errorBlock}><Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text><Pressable onPress={() => { setError(''); setLoading(true); void fetchPage(0, false, requestId.current); }}><Text style={[styles.retry, { color: colors.primary }]}>{t('retry')}</Text></Pressable></View> : null}
          </View>
        )}
        renderItem={({ item }) => <ProductTile product={item} onPress={() => router.push(`/product/${item.id}`)} />}
        ListEmptyComponent={loading ? <ActivityIndicator style={styles.spinner} color={colors.primary} /> : error ? undefined : <Text style={[styles.empty, { color: colors.muted }]}>{category ? t('emptyCategory') : t('noResults')}</Text>}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.spinner} color={colors.primary} /> : <View style={{ height: 16 }} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  listContent: { paddingHorizontal: 16, paddingBottom: 12 },
  header: { gap: 16, paddingTop: 9, paddingBottom: 17 },
  brandLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  heading: { fontFamily: 'Georgia', fontSize: 27, fontWeight: '700', marginTop: 5 },
  avatar: { width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#183A32', fontSize: 15, fontWeight: '800' },
  searchBox: { minHeight: 48, borderWidth: 1, borderRadius: 4, alignItems: 'center', gap: 10, paddingHorizontal: 13 },
  searchInput: { flex: 1, height: 46, fontSize: 14 },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, borderRadius: 3 },
  offlineText: { flex: 1, fontSize: 11 },
  sectionLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: -8 },
  sectionLabel: { fontSize: 14, fontWeight: '800' },
  categoryList: { gap: 8, paddingRight: 10 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 3, borderWidth: 1 },
  categoryText: { fontSize: 12, fontWeight: '700' },
  sortLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultCount: { fontSize: 11, fontWeight: '600' },
  sortControl: { maxWidth: '72%', minHeight: 35, borderWidth: 1, borderRadius: 3, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  sortText: { fontSize: 11, fontWeight: '700' },
  columns: { gap: 12 },
  spinner: { marginTop: 28 },
  empty: { textAlign: 'center', paddingVertical: 25, fontSize: 14 },
  errorBlock: { gap: 8, alignItems: 'center', padding: 10 },
  errorText: { fontSize: 13, textAlign: 'center' },
  retry: { fontWeight: '800', fontSize: 13 },
});