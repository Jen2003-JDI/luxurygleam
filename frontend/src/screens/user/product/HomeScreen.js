import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchFeatured, fetchProducts } from '../../../redux/slices/user/productSlice';
import { COLORS, SPACING, BORDER_RADIUS, CATEGORIES } from '../../../constants/theme';
import { selectUnreadCount } from '../../../redux/slices/user/notificationSlice';
import { fetchNotifications } from '../../../redux/slices/user/notificationSlice';
import ProductCard from '../../../components/product/ProductCard';
import ScreenHeader from '../../../components/ui/ScreenHeader';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { featured, products, loading } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  const unreadCount = useSelector(selectUnreadCount);

  useEffect(() => {
    dispatch(fetchFeatured());
    dispatch(fetchProducts({ limit: 12 }));
    dispatch(fetchNotifications());
  }, []);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchFeatured());
      dispatch(fetchProducts({ limit: 12 }));
    }, [dispatch])
  );

  const onRefresh = useCallback(() => {
    dispatch(fetchFeatured());
    dispatch(fetchProducts({ limit: 12 }));
  }, []);

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryChip}
      onPress={() => navigation.navigate('SearchTab', { category: item.value })}
    >
      <Text style={styles.categoryEmoji}>{item.icon || '✨'}</Text>
      <Text style={styles.categoryLabel}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="LUXURY GLEAM"
        subtitle={`Welcome, ${user?.name?.split(' ')[0]}`}
        onMenuPress={() => navigation.openDrawer()}
        onNotifPress={() => navigation.navigate('Notifications')}
        notifCount={unreadCount}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTag}>NEW COLLECTION</Text>
            <Text style={styles.heroTitle}>Timeless{'\n'}Elegance</Text>
            <Text style={styles.heroSubtitle}>Discover our finest jewelry crafted for you</Text>
            <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.navigate('SearchTab')}>
              <Text style={styles.heroBtnText}>EXPLORE NOW →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroGem}>💍</Text>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <FlatList
            data={CATEGORIES.filter((c) => c.value)}
            keyExtractor={(item) => item.value}
            renderItem={renderCategory}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          />
        </View>

        {/* Featured Products */}
        {featured.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SearchTab')}>
                <Text style={styles.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={featured}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  horizontal
                  style={styles.featuredCard}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
                />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: SPACING.md }} />}
              contentContainerStyle={{ paddingHorizontal: SPACING.base }}
            />
          </View>
        )}

        {/* All Products Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Pieces</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SearchTab')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          {loading && products.length === 0 ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.productsGrid}>
              {products.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  style={styles.gridItem}
                  onPress={() => navigation.navigate('ProductDetail', { productId: p._id })}
                />
              ))}
            </View>
          )}
        </View>

        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <Text style={styles.promoText}>✨ Free Shipping on Orders Over ₱5,000 ✨</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  heroBanner: {
    margin: SPACING.base, borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.xl, flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden',
  },
  heroContent: { flex: 1 },
  heroTag: { fontSize: 10, color: COLORS.primary, letterSpacing: 3, fontWeight: '700', marginBottom: 8 },
  heroTitle: { fontSize: 32, color: COLORS.text, fontWeight: '700', lineHeight: 38, marginBottom: 8 },
  heroSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  heroBtn: {
    alignSelf: 'flex-start', backgroundColor: COLORS.primary,
    paddingVertical: 10, paddingHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.full,
  },
  heroBtnText: { color: COLORS.background, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  heroGem: { fontSize: 72, opacity: 0.6, marginLeft: SPACING.md },
  section: { marginBottom: SPACING.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.base, marginBottom: SPACING.md },
  sectionTitle: { fontSize: 20, color: COLORS.text, fontWeight: '700', paddingHorizontal: SPACING.base, marginBottom: SPACING.md },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  categoriesRow: { paddingHorizontal: SPACING.base, gap: SPACING.sm },
  categoryChip: {
    alignItems: 'center', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md, minWidth: 80,
  },
  categoryEmoji: { fontSize: 24, marginBottom: 4 },
  categoryLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  featuredCard: { width: 280 },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.base, gap: SPACING.md },
  gridItem: { width: '47%' },
  promoBanner: {
    margin: SPACING.base, padding: SPACING.lg, backgroundColor: COLORS.primaryDark,
    borderRadius: BORDER_RADIUS.md, alignItems: 'center',
  },
  promoText: { color: COLORS.primaryLight, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
});
