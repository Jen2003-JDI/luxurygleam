import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function ProductCard({ product, onPress, style, horizontal }) {
  const basePrice = Number(product.price) || 0;
  const rawDiscountPrice = Number(product.discountPrice) || 0;
  const effectiveDiscountPrice = rawDiscountPrice > 0 && rawDiscountPrice < 100 && basePrice > 0
    ? Number((basePrice * (1 - rawDiscountPrice / 100)).toFixed(2))
    : rawDiscountPrice;
  const displayPrice = effectiveDiscountPrice > 0 ? effectiveDiscountPrice : basePrice;
  const discount = effectiveDiscountPrice > 0 && effectiveDiscountPrice < basePrice
    ? Math.round(((basePrice - effectiveDiscountPrice) / basePrice) * 100)
    : 0;
  const firstImage = product.images?.[0];
  const image = typeof firstImage === 'string' ? firstImage : firstImage?.url;

  if (horizontal) {
    return (
      <TouchableOpacity style={[styles.hCard, style]} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.hImageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.hImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}><Text style={{ fontSize: 32 }}>💎</Text></View>
          )}
          {discount > 0 && (
            <View style={styles.discountBadge}><Text style={styles.discountText}>-{discount}%</Text></View>
          )}
        </View>
        <View style={styles.hInfo}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.hName} numberOfLines={2}>{product.name}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingText}>{product.ratings?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.reviews}>({product.numReviews})</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₱{displayPrice.toLocaleString()}</Text>
            {discount > 0 && (
              <Text style={styles.originalPrice}>₱{basePrice.toLocaleString()}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}><Text style={{ fontSize: 32 }}>💎</Text></View>
        )}
        {discount > 0 && (
          <View style={styles.discountBadge}><Text style={styles.discountText}>-{discount}%</Text></View>
        )}
        {product.stock === 0 && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.ratingText}>{product.ratings?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.reviews}>({product.numReviews})</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₱{displayPrice.toLocaleString()}</Text>
          {discount > 0 && <Text style={styles.originalPrice}>₱{basePrice.toLocaleString()}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  imageContainer: { width: '100%', aspectRatio: 1, backgroundColor: COLORS.surfaceLight },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surfaceLight },
  discountBadge: {
    position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  discountText: { fontSize: 10, color: COLORS.white, fontWeight: '700' },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  outOfStockText: { color: COLORS.white, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  info: { padding: SPACING.sm },
  category: { fontSize: 10, color: COLORS.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  name: { fontSize: 13, color: COLORS.text, fontWeight: '600', marginBottom: 4, lineHeight: 18 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 4 },
  star: { color: COLORS.starFilled, fontSize: 12 },
  ratingText: { fontSize: 11, color: COLORS.text, fontWeight: '600' },
  reviews: { fontSize: 10, color: COLORS.textMuted },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  price: { fontSize: 15, color: COLORS.primary, fontWeight: '700' },
  originalPrice: { fontSize: 11, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  // Horizontal card
  hCard: {
    flexDirection: 'row', width: 260, backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  hImageContainer: { width: 110, height: 140, backgroundColor: COLORS.surfaceLight },
  hImage: { width: 110, height: 140 },
  hInfo: { flex: 1, padding: SPACING.sm, justifyContent: 'center', gap: 4 },
  hName: { fontSize: 14, color: COLORS.text, fontWeight: '600', lineHeight: 20 },
});
