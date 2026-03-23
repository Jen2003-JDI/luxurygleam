import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput,
  ScrollView, Image, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchProducts, fetchFeatured, createProduct, updateProduct, deleteProduct } from '../../../redux/slices/user/productSlice';
import { COLORS, SPACING, BORDER_RADIUS, CATEGORIES } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';

const BLANK = { name: '', description: '', price: '', discountPrice: '', category: 'Rings', material: '', gemstone: '', stock: '', isFeatured: false };

export default function AdminProductsScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { products, loading } = useSelector((s) => s.products);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh on focus
  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchProducts({ limit: 50 }));
      const interval = setInterval(() => {
        dispatch(fetchProducts({ limit: 50 }));
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }, [dispatch])
  );

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchProducts({ limit: 50 }));
    setRefreshing(false);
  };

  const update = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  const openCreate = () => { setForm(BLANK); setImages([]); setEditingId(null); setModalVisible(true); };
  const openEdit = (product) => {
    setForm({
      name: product.name, description: product.description,
      price: product.price.toString(), discountPrice: (product.discountPrice || '').toString(),
      category: product.category, material: product.material || '',
      gemstone: product.gemstone || '', stock: product.stock.toString(),
      isFeatured: product.isFeatured,
    });
    setImages((product.images || []).map((img) => (typeof img === 'string' ? img : img?.url)).filter(Boolean));
    setEditingId(product._id);
    setModalVisible(true);
  };

  const pickImages = async (fromCamera = false) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Toast.show({ type: 'error', text1: 'Permission denied' });

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, quality: 0.8, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (!result.canceled) {
      const newImgs = result.assets || [result];
      setImages((prev) => [...prev, ...newImgs.map((a) => a.uri)].slice(0, 5));
    }
  };

  const showPickerOptions = () => {
    Alert.alert('Add Images', 'Choose source', [
      { text: 'Camera', onPress: () => pickImages(true) },
      { text: 'Photo Library', onPress: () => pickImages(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock || !form.description)
      return Toast.show({ type: 'error', text1: 'Fill all required fields' });
    if (!editingId && images.length === 0)
      return Toast.show({ type: 'error', text1: 'Add at least one product image' });

    const priceNum = Number(form.price);
    const discountInputNum = Number(form.discountPrice || 0);
    let finalDiscountPrice = 0;
    if (discountInputNum > 0) {
      finalDiscountPrice = discountInputNum < 100
        ? Number((priceNum * (1 - discountInputNum / 100)).toFixed(2))
        : Number(discountInputNum.toFixed(2));
    }

    if (finalDiscountPrice >= priceNum && finalDiscountPrice > 0) {
      return Toast.show({
        type: 'error',
        text1: 'Invalid discount',
        text2: 'Discount must make sale price lower than original price',
      });
    }

    const normalizedPayload = {
      name: form.name,
      description: form.description,
      price: form.price,
      discountPrice: String(finalDiscountPrice),
      category: form.category,
      material: form.material,
      gemstone: form.gemstone,
      stock: form.stock,
      isFeatured: form.isFeatured,
    };

    const localImages = images.filter((uri) =>
      typeof uri === 'string' && (uri.startsWith('file:') || uri.startsWith('content:') || uri.startsWith('ph://'))
    );

    setSaving(true);

    let result;
    if (editingId) {
      if (localImages.length > 0) {
        const formData = new FormData();
        Object.entries(normalizedPayload).forEach(([k, v]) => formData.append(k, String(v)));
        localImages.forEach((uri, i) => {
          const ext = (uri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
          const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
          formData.append('images', { uri, name: `product_${i}.${ext}`, type: mimeType });
        });
        result = await dispatch(updateProduct({ id: editingId, data: formData }));
      } else {
        result = await dispatch(updateProduct({ id: editingId, data: normalizedPayload }));
      }
    } else {
      const formData = new FormData();
      Object.entries(normalizedPayload).forEach(([k, v]) => formData.append(k, String(v)));
      localImages.forEach((uri, i) => {
        const ext = (uri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
        const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
        formData.append('images', { uri, name: `product_${i}.${ext}`, type: mimeType });
      });
      result = await dispatch(createProduct(formData));
    }

    setSaving(false);

    if (createProduct.fulfilled.match(result) || updateProduct.fulfilled.match(result)) {
      await dispatch(fetchProducts({ limit: 50 }));
      await dispatch(fetchFeatured());
      Toast.show({ type: 'success', text1: editingId ? '✓ Product Updated' : '✓ Product Created' });
      setModalVisible(false);
    } else {
      Toast.show({ type: 'error', text1: 'Save failed', text2: result.payload || 'Please check all required fields and try again' });
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Product', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteProduct(id)) },
    ]);
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productRow}>
      <Image
        source={{ uri: item.images?.[0]?.url }}
        style={styles.productThumb}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productCat}>{item.category}</Text>
        <Text style={styles.productPrice}>₱{item.price.toLocaleString()} · Stock: {item.stock}</Text>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id, item.name)}>
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="MANAGE PRODUCTS"
        onBack={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No products yet. Add your first product!</Text>
            </View>
          }
        />
      )}

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Product' : 'New Product'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Images */}
            <Text style={styles.sectionLabel}>Product Images {!editingId && '*'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imagesRow}>
                {images.map((uri, i) => (
                  <View key={i} style={styles.imgThumb}>
                    <Image source={{ uri }} style={styles.imgThumbImage} />
                    <TouchableOpacity style={styles.removeImg} onPress={() => setImages((p) => p.filter((_, idx) => idx !== i))}>
                      <Text style={{ color: COLORS.white, fontSize: 10 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 5 && (
                  <TouchableOpacity style={styles.addImgBtn} onPress={showPickerOptions}>
                    <Text style={{ fontSize: 28, color: COLORS.primary }}>+</Text>
                    <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            {/* Fields */}
            {[
              { key: 'name', label: 'Product Name *', placeholder: 'e.g. Diamond Solitaire Ring' },
              { key: 'price', label: 'Price (₱) *', placeholder: '0.00', keyboard: 'numeric' },
              { key: 'discountPrice', label: 'Discount (% or Sale Price ₱)', placeholder: 'e.g. 5 for 5% or 9500 as sale price', keyboard: 'numeric' },
              { key: 'stock', label: 'Stock Quantity *', placeholder: '0', keyboard: 'numeric' },
              { key: 'material', label: 'Material', placeholder: 'e.g. 18K Gold, Sterling Silver' },
              { key: 'gemstone', label: 'Gemstone', placeholder: 'e.g. Diamond, Ruby, Sapphire' },
            ].map((f) => (
              <View key={f.key} style={styles.formField}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  value={form[f.key]}
                  onChangeText={(v) => update(f.key, v)}
                  keyboardType={f.keyboard || 'default'}
                />
              </View>
            ))}

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Category *</Text>
              <TouchableOpacity style={styles.categorySelector} onPress={() => setCategoryModalVisible(true)}>
                <Text style={styles.categorySelectorText}>{form.category}</Text>
                <Text style={styles.categorySelectorArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Description *</Text>
              <TextInput
                style={[styles.fieldInput, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Describe the product in detail..."
                placeholderTextColor={COLORS.textMuted}
                value={form.description}
                onChangeText={(v) => update('description', v)}
                multiline
              />
            </View>

            <TouchableOpacity
              style={[styles.featuredToggle, form.isFeatured && styles.featuredActive]}
              onPress={() => update('isFeatured', !form.isFeatured)}
            >
              <Text style={styles.featuredText}>
                {form.isFeatured ? '⭐ Featured Product' : '☆ Mark as Featured'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={categoryModalVisible} transparent animationType="fade">
        <View style={styles.categoryModalOverlay}>
          <View style={styles.categoryModalCard}>
            <Text style={styles.categoryModalTitle}>Select Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CATEGORIES.filter((c) => c.value).map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.categoryOption, form.category === c.value && styles.categoryOptionActive]}
                  onPress={() => {
                    update('category', c.value);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text style={[styles.categoryOptionText, form.category === c.value && styles.categoryOptionTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.categoryModalClose} onPress={() => setCategoryModalVisible(false)}>
              <Text style={styles.categoryModalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: BORDER_RADIUS.full },
  addBtnText: { color: COLORS.background, fontSize: 13, fontWeight: '700' },
  list: { padding: SPACING.base, gap: SPACING.md },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  productThumb: { width: 70, height: 70, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.surfaceLight },
  productInfo: { flex: 1, gap: 3 },
  productName: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  productCat: { fontSize: 11, color: COLORS.primary },
  productPrice: { fontSize: 12, color: COLORS.textSecondary },
  productActions: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  editBtn: { backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: BORDER_RADIUS.sm },
  editBtnText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 18 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center' },
  // Modal
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cancelText: { color: COLORS.textSecondary, fontSize: 15 },
  modalTitle: { fontSize: 16, color: COLORS.text, fontWeight: '700' },
  saveText: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
  modalContent: { padding: SPACING.base, gap: SPACING.md },
  sectionLabel: { fontSize: 12, color: COLORS.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  imagesRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  imgThumb: { width: 80, height: 80, borderRadius: BORDER_RADIUS.sm, overflow: 'hidden', position: 'relative' },
  imgThumbImage: { width: '100%', height: '100%' },
  removeImg: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center' },
  addImgBtn: { width: 80, height: 80, borderRadius: BORDER_RADIUS.sm, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  formField: { gap: 6 },
  fieldLabel: { fontSize: 12, color: COLORS.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  fieldInput: { backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, color: COLORS.text, fontSize: 14 },
  categorySelector: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categorySelectorText: { color: COLORS.text, fontSize: 16 },
  categorySelectorArrow: { color: COLORS.primary, fontSize: 12 },
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.base,
  },
  categoryModalCard: {
    maxHeight: '70%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  categoryModalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: 6,
  },
  categoryOptionActive: {
    backgroundColor: COLORS.primaryDark + '55',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  categoryOptionText: { color: COLORS.text, fontSize: 15 },
  categoryOptionTextActive: { color: COLORS.primary, fontWeight: '700' },
  categoryModalClose: {
    marginTop: SPACING.sm,
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  categoryModalCloseText: { color: COLORS.textSecondary, fontSize: 14 },
  featuredToggle: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  featuredActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDark + '33' },
  featuredText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
});
