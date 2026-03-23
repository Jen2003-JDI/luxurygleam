import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createReview, updateReview } from '../../../redux/slices/user/reviewSlice';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';

export default function WriteReviewScreen({ route, navigation }) {
  const { productId, orderId, existingReview, productName } = route.params || {};
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { loading } = useSelector((s) => s.reviews);

  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [existingImages, setExistingImages] = useState(
    Array.isArray(existingReview?.images)
      ? existingReview.images
        .map((img) => (typeof img === 'string' ? { url: img } : img))
        .filter((img) => !!(img?.url || img?.secure_url || img?.path))
      : []
  );
  const [newImages, setNewImages] = useState([]);
  const isEdit = !!existingReview;

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const totalImages = existingImages.length + newImages.length;

  const pickImages = async () => {
    if (totalImages >= 3) return Toast.show({ type: 'info', text1: 'Maximum 3 images' });
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const picked = result.assets.slice(0, 3 - totalImages);
      setNewImages((prev) => [...prev, ...picked.map((a) => a.uri)]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return Toast.show({ type: 'error', text1: 'Please add a review title' });
    if (!comment.trim()) return Toast.show({ type: 'error', text1: 'Please write your review' });

    if (isEdit) {
      const formData = new FormData();
      formData.append('rating', rating.toString());
      formData.append('title', title);
      formData.append('comment', comment);
      formData.append('retainedImages', JSON.stringify(existingImages));
      newImages.forEach((uri, i) => {
        const ext = uri.split('.').pop();
        formData.append('images', { uri, name: `review_edit_${i}.${ext}`, type: `image/${ext}` });
      });

      const result = await dispatch(updateReview({ id: existingReview._id, formData }));
      if (updateReview.fulfilled.match(result)) {
        Toast.show({ type: 'success', text1: '✓ Review Updated' });
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: result.payload || 'Failed to update review' });
      }
    } else {
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('orderId', orderId);
      formData.append('rating', rating.toString());
      formData.append('title', title);
      formData.append('comment', comment);
      newImages.forEach((uri, i) => {
        const ext = uri.split('.').pop();
        formData.append('images', { uri, name: `review_${i}.${ext}`, type: `image/${ext}` });
      });
      const result = await dispatch(createReview(formData));
      if (createReview.fulfilled.match(result)) {
        Toast.show({
          type: 'success',
          text1: '✨ Review Submitted!',
          text2: 'Pending moderation approval',
        });
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: result.payload || 'Failed to submit' });
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={isEdit ? 'EDIT REVIEW' : 'WRITE REVIEW'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Name */}
        {productName && (
          <View style={styles.productCard}>
            <Text style={styles.productLabel}>Product</Text>
            <Text style={styles.productName} numberOfLines={2}>{productName}</Text>
          </View>
        )}

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Your Rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text style={[styles.star, star <= rating && styles.starActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingWord}>{ratingLabels[rating]}</Text>
        </View>

        {/* Review Form */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Review Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Summarize your experience..."
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <Text style={styles.charCount}>{title.length}/100</Text>

          <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>Your Review</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Share details about the product quality, design, and your overall experience..."
            placeholderTextColor={COLORS.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/1000</Text>
        </View>

        {/* Photo Upload */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📸 {isEdit ? 'Manage Photos' : 'Add Photos (Optional)'}</Text>
          <Text style={styles.photoHint}>Share photos of your jewelry (max 3 photos)</Text>
          <View style={styles.photosRow}>
            {existingImages.map((img, i) => {
              const uri = img?.url || img?.secure_url || img?.path;
              if (!uri) return null;
              return (
                <View key={`existing-${i}`} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.thumbImage} />
                  <TouchableOpacity
                    style={styles.removePhoto}
                    onPress={() => setExistingImages((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {newImages.map((uri, i) => (
              <View key={`new-${i}`} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.thumbImage} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => setNewImages((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {totalImages < 3 && (
              <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImages}>
                <Text style={styles.addPhotoIcon}>+</Text>
                <Text style={styles.addPhotoText}>{isEdit ? 'Add Photo' : 'Add Photo'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Review Tips</Text>
          <Text style={styles.tipText}>• Focus on quality, appearance, and craftsmanship</Text>
          <Text style={styles.tipText}>• Mention how well it matches the description</Text>
          <Text style={styles.tipText}>• Would you recommend it to others?</Text>
          <Text style={styles.tipText}>• Your review will be checked for appropriateness</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.submitBtnText}>{isEdit ? 'UPDATE REVIEW' : 'SUBMIT REVIEW'}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, gap: SPACING.md },
  productCard: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.xs },
  productLabel: { fontSize: 12, color: COLORS.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  productName: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  ratingSection: { alignItems: 'center', paddingVertical: SPACING.xl, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  ratingLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.md, letterSpacing: 1 },
  starsRow: { flexDirection: 'row', gap: SPACING.md },
  star: { fontSize: 44, color: COLORS.starEmpty },
  starActive: { color: COLORS.starFilled },
  ratingWord: { fontSize: 18, color: COLORS.primary, fontWeight: '700', marginTop: SPACING.md, letterSpacing: 2 },
  card: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 15, color: COLORS.text, fontWeight: '700', marginBottom: SPACING.sm },
  inputLabel: { fontSize: 12, color: COLORS.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, color: COLORS.text, fontSize: 14 },
  textArea: { height: 140, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },
  photoHint: { fontSize: 12, color: COLORS.textSecondary, marginBottom: SPACING.md },
  photosRow: { flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap' },
  photoThumb: { width: 80, height: 80, borderRadius: BORDER_RADIUS.sm, overflow: 'hidden', position: 'relative' },
  thumbImage: { width: '100%', height: '100%' },
  removePhoto: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center' },
  removePhotoText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  addPhotoBtn: { width: 80, height: 80, borderRadius: BORDER_RADIUS.sm, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 4 },
  addPhotoIcon: { fontSize: 24, color: COLORS.primary },
  addPhotoText: { fontSize: 10, color: COLORS.textSecondary },
  tipsCard: { backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.xs },
  tipsTitle: { fontSize: 13, color: COLORS.text, fontWeight: '600', marginBottom: SPACING.xs },
  tipText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 20 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, height: 54, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: COLORS.background, fontSize: 15, fontWeight: '700', letterSpacing: 1.5 },
});
