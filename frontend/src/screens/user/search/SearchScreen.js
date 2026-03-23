import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, ScrollView, Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchProducts } from '../../../redux/slices/user/productSlice';
import { COLORS, SPACING, BORDER_RADIUS, CATEGORIES } from '../../../constants/theme';
import ProductCard from '../../../components/product/ProductCard';

export default function SearchScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { products, loading, total } = useSelector((s) => s.products);

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(route?.params?.category || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [filterVisible, setFilterVisible] = useState(false);
  const [page, setPage] = useState(1);

  const search = useCallback((reset = true, overrides = {}) => {
    const p = reset ? 1 : page;
    if (reset) setPage(1);
    dispatch(fetchProducts({
      keyword: overrides.keyword !== undefined ? overrides.keyword : debouncedKeyword,
      category: overrides.category !== undefined ? overrides.category : selectedCategory,
      minPrice: overrides.minPrice !== undefined ? overrides.minPrice : minPrice,
      maxPrice: overrides.maxPrice !== undefined ? overrides.maxPrice : maxPrice,
      sort: overrides.sort !== undefined ? overrides.sort : sort,
      page: p,
      limit: 20,
    }));
  }, [debouncedKeyword, selectedCategory, minPrice, maxPrice, sort, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    search(true);
  }, [selectedCategory, sort, debouncedKeyword]);

  const sortOptions = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Top Rated', value: 'rating' },
  ];

  const sortPillWidthByValue = {
    newest: 96,
    price_asc: 168,
    price_desc: 168,
    rating: 116,
  };

  const applyFilters = () => { search(true); setFilterVisible(false); };
  const clearFilters = () => {
    setMinPrice(''); setMaxPrice(''); setSelectedCategory('');
    setFilterVisible(false);
    dispatch(fetchProducts({ limit: 20 }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search jewelry..."
            placeholderTextColor={COLORS.textMuted}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={() => search(true)}
            returnKeyType="search"
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => { setKeyword(''); setDebouncedKeyword(''); search(true, { keyword: '' }); }}>
              <Text style={{ color: COLORS.textMuted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterVisible(true)}>
          <Text style={styles.filterIcon}>⚙️</Text>
          {(selectedCategory || minPrice || maxPrice) && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesRow}
        contentContainerStyle={styles.categoriesRowContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[styles.catPill, selectedCategory === cat.value && styles.catPillActive]}
            onPress={() => setSelectedCategory(cat.value)}
          >
            {cat.icon && <Text style={styles.catIcon}>{cat.icon}</Text>}
            <Text style={[styles.catPillText, selectedCategory === cat.value && styles.catPillTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortRow}
        contentContainerStyle={styles.sortRowContent}
      >
        {sortOptions.map((o) => (
          <TouchableOpacity
            key={o.value}
            style={[
              styles.sortPill,
              { minWidth: sortPillWidthByValue[o.value] || 132 },
              sort === o.value && styles.sortPillActive,
            ]}
            onPress={() => setSort(o.value)}
          >
            <Text
              numberOfLines={1}
              style={[styles.sortPillText, sort === o.value && styles.sortPillTextActive]}
            >
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <Text style={styles.resultsText}>{total} results found</Text>

      {/* Products Grid */}
      {loading && products.length === 0 ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              style={styles.gridItem}
              onPress={() => navigation.navigate('HomeTab', { screen: 'ProductDetail', params: { productId: item._id } })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          }
          onEndReached={() => { setPage((p) => p + 1); search(false); }}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filters</Text>

            <Text style={styles.filterLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[styles.catPill, selectedCategory === cat.value && styles.catPillActive]}
                    onPress={() => setSelectedCategory(cat.value)}
                  >
                    <Text style={[styles.catPillText, selectedCategory === cat.value && styles.catPillTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.filterLabel}>Price Range (₱)</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                placeholderTextColor={COLORS.textMuted}
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
              />
              <Text style={{ color: COLORS.textSecondary }}>—</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                placeholderTextColor={COLORS.textMuted}
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setFilterVisible(false)}>
              <Text style={{ color: COLORS.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchHeader: { flexDirection: 'row', padding: SPACING.base, gap: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, height: 46 },
  searchIcon: { fontSize: 16, marginRight: SPACING.sm },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 15 },
  filterBtn: { width: 46, height: 46, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  filterIcon: { fontSize: 20 },
  filterDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  categoriesRow: {
    backgroundColor: COLORS.surface,
    paddingTop: SPACING.xs,
    paddingBottom: 2,
    minHeight: 50,
  },
  categoriesRowContent: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingRight: SPACING.xxl,
    paddingVertical: 2,
    alignItems: 'center',
  },
  catPill: {
    minHeight: 36,
    minWidth: 88,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
    gap: 6,
  },
  catIcon: { fontSize: 14, lineHeight: 16 },
  catPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catPillText: { fontSize: 12, color: COLORS.text, lineHeight: 16 },
  catPillTextActive: { color: COLORS.background, fontWeight: '700' },
  sortRow: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 2,
    paddingBottom: SPACING.xs,
    minHeight: 50,
  },
  sortRowContent: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingRight: SPACING.xxl,
    paddingVertical: 2,
    alignItems: 'center',
  },
  sortPill: {
    minHeight: 36,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sortPillActive: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceLight },
  sortPillText: { fontSize: 12, color: COLORS.text, lineHeight: 16, flexShrink: 0 },
  sortPillTextActive: { color: COLORS.primary, fontWeight: '600' },
  resultsText: { fontSize: 12, color: COLORS.textMuted, paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm },
  grid: { paddingHorizontal: SPACING.base, paddingBottom: 20 },
  row: { gap: SPACING.md, marginBottom: SPACING.md },
  gridItem: { flex: 1 },
  empty: { alignItems: 'center', padding: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: 18, color: COLORS.text, fontWeight: '600', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, gap: SPACING.md },
  modalTitle: { fontSize: 20, color: COLORS.text, fontWeight: '700', marginBottom: SPACING.sm },
  filterLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  priceInput: { flex: 1, backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  clearBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  clearBtnText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  applyBtn: { flex: 2, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  applyBtnText: { color: COLORS.background, fontSize: 14, fontWeight: '700' },
  closeBtn: { alignItems: 'center', padding: SPACING.sm },
});
