import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  FlatList, ActivityIndicator, Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { fetchProduct } from '../../../redux/slices/user/productSlice';
import { fetchReviews } from '../../../redux/slices/user/reviewSlice';
import { addToCart } from '../../../redux/slices/user/cartSlice';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import StarRating from '../../../components/ui/StarRating';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const dispatch = useDispatch();
  const { selectedProduct: product, loading } = useSelector((s) => s.products);
  const { reviews } = useSelector((s) => s.reviews);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    dispatch(fetchProduct(productId));
    dispatch(fetchReviews({ productId }));
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stock === 0) return Toast.show({ type: 'error', text1: 'Out of Stock' });

    const basePrice = Number(product.price) || 0;
    const rawDiscountPrice = Number(product.discountPrice) || 0;
    const effectiveDiscountPrice = rawDiscountPrice > 0 && rawDiscountPrice < 100 && basePrice > 0
      ? Number((basePrice * (1 - rawDiscountPrice / 100)).toFixed(2))
      : rawDiscountPrice;
    const finalPrice = effectiveDiscountPrice > 0 ? effectiveDiscountPrice : basePrice;

    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: finalPrice,
      image: product.images?.[0]?.url || '',
      quantity: qty,
      stock: product.stock,
    }));
    Toast.show({ type: 'success', text1: '✨ Added to Cart', text2: product.name });
  };

  if (loading || !product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const basePrice = Number(product.price) || 0;
  const rawDiscountPrice = Number(product.discountPrice) || 0;
  const effectiveDiscountPrice = rawDiscountPrice > 0 && rawDiscountPrice < 100 && basePrice > 0
    ? Number((basePrice * (1 - rawDiscountPrice / 100)).toFixed(2))
    : rawDiscountPrice;
  const displayPrice = effectiveDiscountPrice > 0 ? effectiveDiscountPrice : basePrice;
  const discount = effectiveDiscountPrice > 0 && effectiveDiscountPrice < basePrice
    ? Math.round(((basePrice - effectiveDiscountPrice) / basePrice) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <ScreenHeader title={product.category} onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View>
          <FlatList
            data={product.images}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item.url }} style={styles.mainImage} resizeMode="cover" />
            )}
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setActiveImg(Math.round(e.nativeEvent.contentOffset.x / width))}
          />
          {/* Dots */}
          <View style={styles.dots}>
            {product.images.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />
            ))}
          </View>
        </View>

        <View style={styles.content}>
          {/* Category & Name */}
          <Text style={styles.categoryLabel}>{product.category}</Text>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <StarRating rating={product.ratings} size={16} />
            <Text style={styles.ratingText}>{product.ratings?.toFixed(1)} ({product.numReviews} reviews)</Text>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>₱{displayPrice.toLocaleString()}</Text>
            {discount > 0 && (
              <>
                <Text style={styles.originalPrice}>₱{basePrice.toLocaleString()}</Text>
                <View style={styles.discountBadge}><Text style={styles.discountText}>-{discount}%</Text></View>
              </>
            )}
          </View>

          {/* Stock */}
          <View style={[styles.stockBadge, { backgroundColor: product.stock > 0 ? '#1a3a1a' : '#3a1a1a' }]}>
            <Text style={[styles.stockText, { color: product.stock > 0 ? COLORS.success : COLORS.error }]}>
              {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
            </Text>
          </View>

          {/* Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Product Details</Text>
            {product.material && <DetailRow label="Material" value={product.material} />}
            {product.gemstone && <DetailRow label="Gemstone" value={product.gemstone} />}
            <DetailRow label="Category" value={product.category} />
          </View>

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.descTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Quantity */}
          {product.stock > 0 && (
            <View style={styles.qtySection}>
              <Text style={styles.qtyLabel}>Quantity</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => Math.min(product.stock, q + 1))}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Reviews Preview */}
          {reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.reviewsTitle}>Customer Reviews</Text>
              {reviews.slice(0, 3).map((r) => (
                <View key={r._id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>{r.user?.name?.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewerName}>{r.user?.name}</Text>
                      <StarRating rating={r.rating} size={12} />
                    </View>
                    {r.isVerifiedPurchase && (
                      <Text style={styles.verifiedBadge}>✓ Verified</Text>
                    )}
                  </View>
                  <Text style={styles.reviewTitle}>{r.title}</Text>
                  <Text style={styles.reviewComment}>{r.comment}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.addToCartBtn, product.stock === 0 && styles.disabledBtn]}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
        >
          <Text style={styles.addToCartText}>
            {product.stock === 0 ? 'OUT OF STOCK' : `ADD TO CART  ₱${(displayPrice * qty).toLocaleString()}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
      <Text style={{ flex: 1, color: COLORS.textSecondary, fontSize: 13 }}>{label}</Text>
      <Text style={{ flex: 2, color: COLORS.text, fontSize: 13, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  mainImage: { width, height: width * 0.85, backgroundColor: COLORS.surfaceLight },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: SPACING.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary, width: 18 },
  content: { padding: SPACING.base, gap: SPACING.md },
  categoryLabel: { fontSize: 11, color: COLORS.primary, letterSpacing: 2, textTransform: 'uppercase' },
  productName: { fontSize: 24, color: COLORS.text, fontWeight: '700', lineHeight: 30 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  ratingText: { fontSize: 13, color: COLORS.textSecondary },
  priceSection: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  price: { fontSize: 28, color: COLORS.primary, fontWeight: '700' },
  originalPrice: { fontSize: 16, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: COLORS.error, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 8, paddingVertical: 3 },
  discountText: { fontSize: 12, color: COLORS.white, fontWeight: '700' },
  stockBadge: { padding: SPACING.sm, borderRadius: BORDER_RADIUS.sm },
  stockText: { fontSize: 13, fontWeight: '600' },
  detailsCard: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  detailsTitle: { fontSize: 15, color: COLORS.text, fontWeight: '700', marginBottom: SPACING.sm },
  descSection: {},
  descTitle: { fontSize: 15, color: COLORS.text, fontWeight: '700', marginBottom: SPACING.sm },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  qtySection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyLabel: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  qtyBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 20, color: COLORS.primary },
  qtyValue: { fontSize: 18, color: COLORS.text, fontWeight: '700', minWidth: 30, textAlign: 'center' },
  reviewsSection: {},
  reviewsTitle: { fontSize: 18, color: COLORS.text, fontWeight: '700', marginBottom: SPACING.md },
  reviewCard: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryDark, justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { color: COLORS.primary, fontWeight: '700' },
  reviewerName: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  verifiedBadge: { fontSize: 10, color: COLORS.success, fontWeight: '600' },
  reviewTitle: { fontSize: 14, color: COLORS.text, fontWeight: '600', marginBottom: 4 },
  reviewComment: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  bottomBar: { padding: SPACING.base, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  addToCartBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, height: 54, justifyContent: 'center', alignItems: 'center' },
  disabledBtn: { backgroundColor: COLORS.border },
  addToCartText: { color: COLORS.background, fontSize: 15, fontWeight: '700', letterSpacing: 1.5 },
});
