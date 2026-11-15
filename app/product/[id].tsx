import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, Minus, Plus, Star } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, SectionTitle } from '../../src/components/Controls';
import { Screen } from '../../src/components/Screen';
import { discountedPrice, api } from '../../src/services/api';
import { repository } from '../../src/db/repository';
import { useAppStore } from '../../src/store/useAppStore';
import { themes } from '../../src/theme/tokens';
import type { Product } from '../../src/types';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  const isFavorite = useAppStore((state) => state.isFavorite(Number(id)));
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const addToCart = useAppStore((state) => state.addToCart);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadProduct = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.product(Number(id));
      setProduct(result);
      setQuantity(result.minimumOrderQuantity ?? 1);
      await repository.cacheProducts([result]);
    } catch {
      const cached = await repository.loadCachedProducts().catch(() => []);
      const result = cached.find((item) => item.id === Number(id));
      if (result) {
        setProduct(result);
        setQuantity(result.minimumOrderQuantity ?? 1);
      } else setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadProduct(); }, [id]);

  const changeQuantity = (delta: number) => {
    if (!product) return;
    const min = product.minimumOrderQuantity ?? 1;
    setQuantity((value) => Math.min(product.stock, Math.max(min, value + delta)));
    setMessage('');
  };

  const add = async () => {
    if (!product) return;
    try {
      await addToCart(product, quantity);
      setMessage(t('added'));
    } catch (reason) {
      setMessage(reason instanceof Error && reason.message === 'minimum' ? t('minError') : t('stockError'));
    }
  };

  if (loading) return <Screen contentStyle={styles.center}><ActivityIndicator color={colors.primary} /></Screen>;
  if (!product) return <Screen contentStyle={styles.center}><Text style={{ color: colors.danger }}>{error}</Text><Button label={t('retry')} onPress={() => void loadProduct()} /></Screen>;

  const minimum = product.minimumOrderQuantity ?? 1;
  const images = product.images?.length ? product.images : [product.thumbnail];

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.surface }]}><ArrowLeft size={20} color={colors.text} /></Pressable>
        <Text style={[styles.topTitle, { color: colors.text }]}>{t('productDetails')}</Text>
        <Pressable onPress={() => void toggleFavorite(product)} style={[styles.iconButton, { backgroundColor: colors.surface }]}><Heart size={20} color={isFavorite ? colors.danger : colors.text} fill={isFavorite ? colors.danger : 'transparent'} /></Pressable>
      </View>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={[styles.gallery, { backgroundColor: colors.surfaceMuted }]}>
        {images.map((image, index) => <Image key={`${image}-${index}`} source={{ uri: image }} style={[styles.galleryImage, { width: screenWidth - 44 }]} contentFit="contain" transition={180} />)}
      </ScrollView>
      <View style={styles.productTop}>
        <Text style={[styles.category, { color: colors.primary }]}>{product.category.replaceAll('-', ' ')}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{product.title}</Text>
        {product.brand ? <Text style={[styles.brand, { color: colors.muted }]}>{product.brand}</Text> : null}
        <View style={styles.rating}><Star size={15} color="#D99A2B" fill="#D99A2B" /><Text style={[styles.ratingText, { color: colors.text }]}>{product.rating.toFixed(1)}</Text><Text style={{ color: colors.muted }}>· {product.reviews?.length ?? 0} {t('reviews')}</Text></View>
        <View style={styles.priceRow}><Text style={[styles.price, { color: colors.text }]}>${discountedPrice(product).toFixed(2)}</Text>{product.discountPercentage > 0 ? <Text style={[styles.oldPrice, { color: colors.muted }]}>${product.price.toFixed(2)}</Text> : null}</View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.section}>
        <SectionTitle title={t('description')} />
        <Text style={[styles.body, { color: colors.muted }]}>{product.description}</Text>
        <View style={styles.infoGrid}>
          <Info label={t('stock')} value={`${product.stock}`} />
          <Info label={t('minimum')} value={`${minimum}`} />
          <Info label={t('warranty')} value={product.warrantyInformation || '—'} />
          <Info label={t('returns')} value={product.returnPolicy || '—'} />
          <Info label={t('shipping')} value={product.shippingInformation || '—'} />
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.section}>
        <SectionTitle title={t('reviews')} subtitle={`${product.reviews?.length ?? 0} ${t('items')}`} />
        {product.reviews?.length ? product.reviews.map((review, index) => (
          <View key={`${review.reviewerEmail}-${index}`} style={[styles.review, { borderBottomColor: colors.border }]}>
            <View style={styles.reviewTop}><Text style={[styles.reviewer, { color: colors.text }]}>{review.reviewerName}</Text><View style={styles.rating}><Star size={12} color="#D99A2B" fill="#D99A2B" /><Text style={[styles.ratingText, { color: colors.text }]}>{review.rating}</Text></View></View>
            <Text style={[styles.body, { color: colors.muted }]}>{review.comment}</Text>
          </View>
        )) : <Text style={[styles.body, { color: colors.muted }]}>{t('noResults')}</Text>}
      </View>
      <View style={[styles.purchaseBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <View style={[styles.stepper, { borderColor: colors.border }]}>
          <Pressable onPress={() => changeQuantity(-1)} disabled={quantity <= minimum} style={styles.stepButton}><Minus size={16} color={colors.text} /></Pressable>
          <Text style={[styles.quantity, { color: colors.text }]}>{quantity}</Text>
          <Pressable onPress={() => changeQuantity(1)} disabled={quantity >= product.stock} style={styles.stepButton}><Plus size={16} color={colors.text} /></Pressable>
        </View>
        <View style={styles.buyButton}><Button label={product.stock <= 0 ? t('outOfStock') : t('addToCart')} onPress={() => void add()} disabled={product.stock <= 0} /></View>
      </View>
      {message ? <Text style={[styles.message, { color: message === t('added') ? colors.success : colors.danger }]}>{message}</Text> : null}
    </Screen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  return <View style={styles.info}><Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 10, gap: 18, paddingBottom: 30 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topTitle: { fontSize: 14, fontWeight: '800' },
  iconButton: { width: 40, height: 40, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  gallery: { height: 290, borderRadius: 4, flexGrow: 0 },
  galleryImage: { width: 330, height: 290 },
  productTop: { gap: 7 },
  category: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  title: { fontFamily: 'Georgia', fontSize: 28, lineHeight: 34, fontWeight: '700' },
  brand: { fontSize: 13 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingText: { fontSize: 13, fontWeight: '800' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 },
  price: { fontSize: 23, fontWeight: '800' },
  oldPrice: { fontSize: 14, textDecorationLine: 'line-through' },
  divider: { height: 1, marginVertical: 2 },
  section: { gap: 12 },
  body: { fontSize: 14, lineHeight: 21 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  info: { width: '47%', gap: 4, paddingVertical: 9 },
  infoLabel: { fontSize: 11, fontWeight: '700' },
  infoValue: { fontSize: 13, lineHeight: 18 },
  review: { paddingVertical: 12, borderBottomWidth: 1, gap: 7 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewer: { fontSize: 13, fontWeight: '800' },
  purchaseBar: { paddingVertical: 11, flexDirection: 'row', gap: 10, borderTopWidth: 1 },
  stepper: { height: 52, borderWidth: 1, borderRadius: 4, flexDirection: 'row', alignItems: 'center' },
  stepButton: { width: 39, height: 48, alignItems: 'center', justifyContent: 'center' },
  quantity: { minWidth: 22, textAlign: 'center', fontWeight: '800' },
  buyButton: { flex: 1 },
  message: { alignSelf: 'center', fontSize: 13, fontWeight: '800' },
});