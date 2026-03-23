import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, TextInput, Modal, FlatList, RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchReviews, replyToReview } from '../../../redux/slices/user/reviewSlice';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';

const BLOCKED_WORDS = [
  'spam', 'fake', 'scam', 'stolen', 'counterfeit', 'adult', 'violence',
  'hate', 'racist', 'nude', 'explicit', 'offensive', 'abusive',
  'fuck', 'fucking', 'bitch', 'shit', 'asshole', 'bastard',
  'dick', 'pussy', 'cunt', 'motherfucker',
];

const containsBlockedWords = (text = '') => {
  const normalized = text.toLowerCase();
  return BLOCKED_WORDS.some((word) => {
    const pattern = new RegExp(`\\b${word}\\b`, 'i');
    return pattern.test(normalized);
  });
};

const hashBlockedWords = (text = '') => {
  return BLOCKED_WORDS.reduce((acc, word) => {
    const pattern = new RegExp(`\\b${word}\\b`, 'gi');
    return acc.replace(pattern, '*'.repeat(word.length));
  }, text);
};

export default function ReviewsScreen({ route, navigation }) {
  const { productId, productName } = route.params;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { reviews, loading } = useSelector((s) => s.reviews);
  const { user } = useSelector((s) => s.auth);

  const [page, setPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, highest, lowest
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshReviews = useCallback(async () => {
    await dispatch(fetchReviews({ productId, page }));
  }, [dispatch, productId, page]);

  useFocusEffect(
    useCallback(() => {
      refreshReviews();
      const interval = setInterval(refreshReviews, 30000);
      return () => clearInterval(interval);
    }, [refreshReviews])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshReviews();
    setRefreshing(false);
  }, [refreshReviews]);

  const handleReply = async () => {
    if (!replyText.trim()) {
      return Toast.show({ type: 'error', text1: 'Reply cannot be empty' });
    }

    const sanitizedReply = hashBlockedWords(replyText.trim());
    const wasFiltered = containsBlockedWords(replyText);

    setReplying(true);
    const result = await dispatch(replyToReview({ reviewId: replyingTo._id, text: sanitizedReply }));
    setReplying(false);
    if (replyToReview.fulfilled.match(result)) {
      if (wasFiltered) {
        Toast.show({ type: 'info', text1: 'Some words were filtered automatically' });
      }
      Toast.show({ type: 'success', text1: '✓ Reply Added' });
      setReplyText('');
      setReplyingTo(null);
    } else {
      Toast.show({ type: 'error', text1: result.payload || 'Failed to add reply' });
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return COLORS.success;
    if (rating >= 3) return COLORS.warning;
    return COLORS.error;
  };

  const canEditReview = (review) => {
    const isOwner = review?.user?._id && user?._id && review.user._id === user._id;
    if (!isOwner) return false;
    const createdAt = new Date(review.createdAt).getTime();
    const daysSinceCreation = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
    return daysSinceCreation <= 30;
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      default: // newest
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  const renderRating = (rating) => (
    <View style={styles.ratingBadge}>
      <Text style={[styles.ratingText, { color: getRatingColor(rating) }]}>
        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
      </Text>
      <Text style={[styles.ratingNumber, { color: getRatingColor(rating) }]}>{rating}</Text>
    </View>
  );

  const renderReview = ({ item: review }) => (
    <View style={styles.reviewCard}>
      {/* Header */}
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          {review.user?.avatar ? (
            <Image source={{ uri: review.user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={styles.avatarText}>{review.user?.name?.[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.userName}>{review.user?.name}</Text>
            <Text style={styles.reviewDate}>
              {new Date(review.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        {renderRating(review.rating)}
      </View>

      {/* Title & Comment */}
      <Text style={styles.reviewTitle}>{review.title}</Text>
      <Text style={styles.reviewComment}>{review.comment}</Text>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
          {review.images.map((img, i) => {
            const imageUri = typeof img === 'string'
              ? img
              : (img?.url || img?.secure_url || img?.path || null);
            if (!imageUri) return null;
            return <Image key={i} source={{ uri: imageUri }} style={styles.reviewImage} />;
          })}
        </ScrollView>
      )}

      {/* Badges */}
      <View style={styles.badgesRow}>
        {review.isVerifiedPurchase && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓ Verified Purchase</Text>
          </View>
        )}
      </View>

      {/* Replies Section */}
      {review.replies && review.replies.length > 0 && (
        <View style={styles.repliesSection}>
          <Text style={styles.repliesTitle}>Replies ({review.replies.length})</Text>
          {review.replies.map((reply, i) => (
            <View key={i} style={styles.replyContainer}>
              <View style={styles.replyHeader}>
                {reply.user?.avatar ? (
                  <Image source={{ uri: reply.user.avatar }} style={styles.replyAvatar} />
                ) : (
                  <View style={[styles.replyAvatar, { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={styles.replyAvatarText}>{reply.user?.name?.[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View>
                  <Text style={styles.replyName}>
                    {reply.user?.name}
                    {reply.isAdminReply && <Text style={styles.adminBadge}> [Admin]</Text>}
                  </Text>
                  <Text style={styles.replyDate}>
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text style={styles.replyText}>{reply.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Reply Button */}
      {user && (
        <View style={styles.reviewActionsRow}>
          <TouchableOpacity
            style={styles.replyBtn}
            onPress={() => setReplyingTo(review)}
          >
            <Text style={styles.replyBtnText}>📝 Reply to this review</Text>
          </TouchableOpacity>

          {canEditReview(review) && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('WriteReview', {
                existingReview: review,
                productId,
                orderId: review.order,
                productName,
              })}
            >
              <Text style={styles.editBtnText}>✏️ Edit My Review</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={`REVIEWS FOR ${productName?.toUpperCase()}`} onBack={() => navigation.goBack()} />

      {/* Sort Menu */}
      <View style={styles.sortBar}>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Text style={styles.sortBtnText}>Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : sortBy === 'highest' ? 'Highest Rating' : 'Lowest Rating'}</Text>
          <Text style={styles.sortIcon}>{showSortMenu ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {showSortMenu && (
        <View style={styles.sortMenu}>
          {['newest', 'oldest', 'highest', 'lowest'].map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.sortOption}
              onPress={() => {
                setSortBy(option);
                setShowSortMenu(false);
              }}
            >
              <Text style={[styles.sortOptionText, sortBy === option && styles.sortOptionActive]}>
                {option === 'newest' ? 'Newest' : option === 'oldest' ? 'Oldest' : option === 'highest' ? 'Highest Rating' : 'Lowest Rating'}
                {sortBy === option && ' ✓'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Reviews List */}
      {loading && !reviews.length ? (
        <View style={styles.centerContent}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>No reviews yet</Text>
          <Text style={styles.emptySubtext}>Be the first to review this product</Text>
        </View>
      ) : (
        <FlatList
          data={sortedReviews}
          renderItem={renderReview}
          keyExtractor={(r) => r._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      {/* Reply Modal */}
      <Modal visible={!!replyingTo} transparent animationType="fade" onRequestClose={() => setReplyingTo(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reply to Review</Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {replyingTo && (
              <View style={styles.originalReview}>
                <Text style={styles.originalTitle}>{replyingTo.title}</Text>
                <Text style={styles.originalComment} numberOfLines={2}>{replyingTo.comment}</Text>
              </View>
            )}

            <TextInput
              style={styles.replyInput}
              placeholder="Write your reply..."
              placeholderTextColor={COLORS.textMuted}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{replyText.length}/500</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setReplyingTo(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, replying && styles.submitBtnDisabled]}
                onPress={handleReply}
                disabled={replying}
              >
                <Text style={styles.submitBtnText}>
                  {replying ? 'Posting...' : 'Post Reply'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  sortBar: { padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sortBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  sortBtnText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  sortIcon: { color: COLORS.primary, fontSize: 12 },
  sortMenu: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  sortOption: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sortOptionText: { color: COLORS.textSecondary, fontSize: 13 },
  sortOptionActive: { color: COLORS.primary, fontWeight: '700' },
  listContent: { padding: SPACING.md, gap: SPACING.md },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.md, fontSize: 14 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: COLORS.textSecondary, fontSize: 13, marginTop: SPACING.xs },

  // Review Card
  reviewCard: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  userName: { color: COLORS.text, fontWeight: '600', fontSize: 13 },
  reviewDate: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  ratingBadge: { alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 14, fontWeight: '600' },
  ratingNumber: { fontSize: 12, fontWeight: '700' },

  reviewTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginTop: SPACING.xs },
  reviewComment: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },

  imagesScroll: { gap: SPACING.sm, marginTop: SPACING.sm },
  reviewImage: { width: 80, height: 80, borderRadius: BORDER_RADIUS.sm },

  badgesRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.xs },
  badge: { backgroundColor: COLORS.success + '20', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.xs },
  badgeText: { color: COLORS.success, fontSize: 11, fontWeight: '600' },

  // Replies
  repliesSection: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.sm },
  repliesTitle: { color: COLORS.text, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  replyContainer: { backgroundColor: COLORS.background, padding: SPACING.sm, borderRadius: BORDER_RADIUS.sm, gap: SPACING.xs },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  replyAvatar: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
  replyAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  replyName: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  adminBadge: { color: COLORS.primary, fontSize: 11 },
  replyDate: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  replyText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginLeft: 40 },

  reviewActionsRow: { gap: SPACING.xs, marginTop: SPACING.sm },
  replyBtn: { marginTop: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: 8, backgroundColor: COLORS.primary + '20', borderRadius: BORDER_RADIUS.sm },
  replyBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  editBtn: { paddingHorizontal: SPACING.md, paddingVertical: 8, backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  editBtnText: { color: COLORS.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', padding: SPACING.md },
  modalContent: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, gap: SPACING.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  closeIcon: { color: COLORS.textSecondary, fontSize: 20 },
  originalReview: { backgroundColor: COLORS.background, padding: SPACING.sm, borderRadius: BORDER_RADIUS.sm },
  originalTitle: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  originalComment: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  replyInput: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, color: COLORS.text, fontSize: 14, minHeight: 100 },
  charCount: { color: COLORS.textMuted, fontSize: 11, textAlign: 'right' },
  modalButtons: { flexDirection: 'row', gap: SPACING.md },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { color: COLORS.text, textAlign: 'center', fontWeight: '600', fontSize: 14 },
  submitBtn: { flex: 1, paddingVertical: 12, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.primary },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.background, textAlign: 'center', fontWeight: '700', fontSize: 14 },
});
