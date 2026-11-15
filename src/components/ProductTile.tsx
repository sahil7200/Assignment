import { Image } from 'expo-image';
import { Heart, Star } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { discountedPrice } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { themes } from '../theme/tokens';
import type { Product } from '../types';

export function ProductTile({ product, onPress }: { product: Product; onPress: () => void }) {
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const colors = themes[theme];
  const isFavorite = useAppStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const price = discountedPrice(product);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={product.title}>
        <View style={[styles.imageWrap, { backgroundColor: colors.surfaceMuted }]}>
          <Image source={{ uri: product.thumbnail }} style={styles.image} contentFit="contain" transition={160} />
          {product.discountPercentage > 0 ? <View style={[styles.badge, { backgroundColor: colors.accent }]}><Text style={styles.badgeText}>-{Math.round(product.discountPercentage)}%</Text></View> : null}
        </View>
        <View style={styles.details}>
          <Text style={[styles.category, { color: colors.muted }]} numberOfLines={1}>{product.category.replaceAll('-', ' ')}</Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
          <View style={styles.rating}><Star size={12} color="#D99A2B" fill="#D99A2B" /><Text style={[styles.ratingText, { color: colors.muted }]}>{product.rating.toFixed(1)}</Text></View>
          <View style={styles.priceLine}>
            <Text style={[styles.price, { color: colors.text }]}>${price.toFixed(2)}</Text>
            {product.discountPercentage > 0 ? <Text style={[styles.oldPrice, { color: colors.muted }]}>${product.price.toFixed(2)}</Text> : null}
          </View>
          {product.stock <= 0 ? <Text style={[styles.stock, { color: colors.danger }]}>{t('outOfStock')}</Text> : null}
        </View>
      </Pressable>
      <Pressable onPress={() => void toggleFavorite(product)} style={[styles.heart, { backgroundColor: colors.surface }]} accessibilityRole="button" accessibilityLabel={isFavorite ? t('removeFavorite') : t('addFavorite')}>
        <Heart size={17} color={isFavorite ? colors.danger : colors.text} fill={isFavorite ? colors.danger : 'transparent'} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, borderRadius: 4, overflow: 'hidden', marginBottom: 13 },
  imageWrap: { aspectRatio: 1.08, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  image: { width: '83%', height: '83%' },
  badge: { position: 'absolute', top: 9, left: 9, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 2 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#183A32' },
  details: { paddingHorizontal: 11, paddingTop: 10, paddingBottom: 12, gap: 5 },
  category: { fontSize: 10, textTransform: 'uppercase', fontWeight: '700' },
  title: { fontSize: 13, lineHeight: 18, fontWeight: '600', minHeight: 36 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 11, fontWeight: '600' },
  priceLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  price: { fontSize: 14, fontWeight: '800' },
  oldPrice: { fontSize: 11, textDecorationLine: 'line-through' },
  stock: { fontSize: 11, fontWeight: '700' },
  heart: { position: 'absolute', right: 9, top: 9, width: 32, height: 32, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});