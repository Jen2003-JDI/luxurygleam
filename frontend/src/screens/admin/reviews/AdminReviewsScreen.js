import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Modal,
  TextInput, ActivityIndicator, Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getAllReviews, updateReviewStatus, toggleReviewHidden,
  replyToReview, fetchReviewAnalytics, deleteReview,
} from '../../../redux/slices/user/reviewSlice';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';

export default function AdminReviewsScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { allReviews, adminLoading, analytics } = useSelector((s) => s.reviews);

  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(getAllReviews({ page: 1, status: statusFilter }));
    dispatch(fetchReviewAnalytics());
  }, [statusFilter]);

  const handleApprove = async (reviewId) => {
    setActionLoading(true);
    const result = await dispatch(updateReviewStatus({ reviewId, status: 'approved' }));
    setActionLoading(false);
    if (updateReviewStatus.fulfilled.match(result)) {
      Toast.show({ type: 'success', text1: '✓ Review Approved' });
      setShowActions(false);
      setSelectedReview(null);
    }
  };

  const handleReject = async (reviewId) => {
    setActionLoading(true);
    const result = await dispatch(updateReviewStatus({ reviewId, status: 'rejected' }));
    setActionLoading(false);
    if (updateReviewStatus.fulfilled.match(result)) {
      Toast.show({ type: 'success', text1: '✓ Review Rejected' });
      setShowActions(false);
      setSelectedReview(null);
    }
  };

  const handleToggleHidden = async (reviewId) => {
    setActionLoading(true);
    const result = await dispatch(toggleReviewHidden(reviewId));
    setActionLoading(false);
    if (toggleReviewHidden.fulfilled.match(result)) {
      Toast.show({ type: 'success', text1: '✓ Review visibility updated' });
    }
  };

  const handleDelete = async (reviewId) => {
    setActionLoading(true);
    const result = await dispatch(deleteReview(reviewId));
    setActionLoading(false);
    if (deleteReview.fulfilled.match(result)) {
      Toast.show({ type: 'success', text1: '✓ Review Deleted' });
      setShowActions(false);
      setSelectedReview(null);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      return Toast.show({ type: 'error', text1: 'Reply cannot be empty' });
    }
    setActionLoading(true);
    const result = await dispatch(replyToReview({ reviewId: replyingTo._id, text: replyText }));
    setActionLoading(false);
    if (replyToReview.fulfilled.match(result)) {
      Toast.show({ type: 'success', text1: '✓ Reply Added' });
      setReplyText('');
      setReplyingTo(null);
      setSelectedReview(result.payload);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return COLORS.success;
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.warning;
    }
  };

  const renderAnalytics = () => {
    if (!analytics) return null;
    return (
      <View style={styles.analyticsContainer}>
        <View style={styles.analyticItem}>
          <Text style={styles.analyticLabel}>Total Reviews</Text>
          <Text style={styles.analyticValue}>{analytics.totalReviews}</Text>
        </View>
        <View style={styles.analyticItem}>
          <Text style={styles.analyticLabel}>Approved</Text>
          <Text style={[styles.analyticValue, { color: COLORS.success }]}>
            {analytics.approvedReviews}
          </Text>
        </View>
        <View style={styles.analyticItem}>
          <Text style={styles.analyticLabel}>Pending</Text>
          <Text style={[styles.analyticValue, { color: COLORS.warning }]}>
            {analytics.pendingReviews}
          </Text>
        </View>
        <View style={styles.analyticItem}>
          <Text style={styles.analyticLabel}>Rejected</Text>
          <Text style={[styles.analyticValue, { color: COLORS.error }]}>
            {analytics.rejectedReviews}
          </Text>
        </View>
      </View>
    );
  };

  const renderReview = ({ item: review }) => (
    <TouchableOpacity
      style={styles.reviewItem}
      onPress={() => {
        setSelectedReview(review);
        setShowActions(true);
      }}
    >
      <View style={styles.reviewItemHeader}>
        <View style={styles.userSection}>
          {review.user?.avatar ? (
            <Image source={{ uri: review.user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={styles.avatarText}>{review.user?.name?.[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.userName}>{review.user?.name}</Text>
            <Text style={styles.userEmail}>{review.user?.email}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(review.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(review.status) }]}>
            {review.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.productName} numberOfLines={1}>
        Product: {review.product?.name}
      </Text>

      <Text style={styles.reviewTitle}>{review.title}</Text>
      <Text style={styles.reviewCommentPreview} numberOfLines={2}>
        {review.comment}
      </Text>

      <View style={styles.reviewFooter}>
        <Text style={styles.rating}>
          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} {review.rating}/5
        </Text>
        {review.isHidden && <Text style={styles.hiddenBadge}>Hidden</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="MANAGE REVIEWS" onBack={() => navigation.goBack()} />

      {/* Analytics */}
      {renderAnalytics()}

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterTab, statusFilter === status && styles.filterTabActive]}
            onPress={() => {
              setStatusFilter(status);
            }}
          >
            <Text
              style={[styles.filterTabText, statusFilter === status && styles.filterTabTextActive]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reviews List */}
      {adminLoading && !allReviews.length ? (
        <View style={styles.centerContent}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : allReviews.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No reviews to review</Text>
        </View>
      ) : (
        <FlatList
          data={allReviews}
          renderItem={renderReview}
          keyExtractor={(r) => r._id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Review Detail Modal */}
      <Modal visible={showActions && !!selectedReview} transparent animationType="slide">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowActions(false)}>
              <Text style={styles.closeBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Review Details</Text>
            <View style={{ width: 50 }} />
          </View>

          {selectedReview && (
            <View style={styles.modalContent}>
              {/* User Info */}
              <View style={styles.detailSection}>
                <View style={styles.userDetail}>
                  {selectedReview.user?.avatar ? (
                    <Image source={{ uri: selectedReview.user.avatar }} style={styles.detailAvatar} />
                  ) : (
                    <View style={[styles.detailAvatar, { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={styles.detailAvatarText}>{selectedReview.user?.name?.[0]?.toUpperCase()}</Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.detailName}>{selectedReview.user?.name}</Text>
                    <Text style={styles.detailEmail}>{selectedReview.user?.email}</Text>
                  </View>
                </View>
              </View>

              {/* Review Content */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Review Content</Text>
                <View style={styles.contentBox}>
                  <Text style={styles.rating}>
                    {'★'.repeat(selectedReview.rating)}{'☆'.repeat(5 - selectedReview.rating)}
                  </Text>
                  <Text style={styles.detailTitle}>{selectedReview.title}</Text>
                  <Text style={styles.detailComment}>{selectedReview.comment}</Text>
                </View>
              </View>

              {/* Images */}
              {selectedReview.images && selectedReview.images.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Images</Text>
                  <View style={styles.imagesGrid}>
                    {selectedReview.images.map((img, i) => {
                      const imageUri = typeof img === 'string'
                        ? img
                        : (img?.url || img?.secure_url || img?.path || null);
                      if (!imageUri) return null;
                      return <Image key={i} source={{ uri: imageUri }} style={styles.gridImage} />;
                    })}
                  </View>
                </View>
              )}

              {/* Replies */}
              {selectedReview.replies && selectedReview.replies.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Replies ({selectedReview.replies.length})</Text>
                  <View style={styles.repliesBox}>
                    {selectedReview.replies.map((reply, i) => (
                      <View key={i} style={styles.replyItem}>
                        <View style={styles.replyUser}>
                          <Text style={styles.replyUserName}>{reply.user?.name}</Text>
                          {reply.isAdminReply && <Text style={styles.adminLabel}>[Admin]</Text>}
                        </View>
                        <Text style={styles.replyItemText}>{reply.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsSection}>
                {selectedReview.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleApprove(selectedReview._id)}
                      disabled={actionLoading}
                    >
                      <Text style={styles.actionBtnText}>✓ Approve Review</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleReject(selectedReview._id)}
                      disabled={actionLoading}
                    >
                      <Text style={styles.actionBtnText}>✕ Reject Review</Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.actionBtn, styles.toggleBtn]}
                  onPress={() => handleToggleHidden(selectedReview._id)}
                  disabled={actionLoading}
                >
                  <Text style={styles.actionBtnText}>
                    {selectedReview.isHidden ? '👁️ Unhide' : '👁️ Hide'} Review
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDelete(selectedReview._id)}
                  disabled={actionLoading}
                >
                  <Text style={styles.actionBtnText}>🗑️ Delete Review</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.replyActionBtn]}
                  onPress={() => setReplyingTo(selectedReview)}
                  disabled={actionLoading}
                >
                  <Text style={styles.actionBtnText}>💬 Reply to Review</Text>
                </TouchableOpacity>
              </View>

              {/* Reply Input */}
              {replyingTo && (
                <View style={styles.replySection}>
                  <Text style={styles.sectionTitle}>Your Reply</Text>
                  <TextInput
                    style={styles.replyInputBox}
                    placeholder="Type your reply as admin..."
                    placeholderTextColor={COLORS.textMuted}
                    value={replyText}
                    onChangeText={setReplyText}
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                  />
                  <Text style={styles.charCount}>{replyText.length}/500</Text>
                  <View style={styles.replyButtons}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.submitBtn, actionLoading && styles.submitBtnDisabled]}
                      onPress={handleReply}
                      disabled={actionLoading}
                    >
                      <Text style={styles.submitBtnText}>
                        {actionLoading ? 'Posting...' : 'Post Reply'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  analyticsContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    justifyContent: 'space-between',
  },
  analyticItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  analyticLabel: { color: COLORS.textSecondary, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  analyticValue: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 4 },

  filterTabs: { flexDirection: 'row', gap: SPACING.xs, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  filterTab: { flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterTabText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  filterTabTextActive: { color: COLORS.background },

  listContent: { padding: SPACING.md, gap: SPACING.md },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },

  reviewItem: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  reviewItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userSection: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  userName: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  userEmail: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.xs },
  statusText: { fontSize: 10, fontWeight: '700' },

  productName: { color: COLORS.textSecondary, fontSize: 11 },
  reviewTitle: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  reviewCommentPreview: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  reviewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.xs },
  rating: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  hiddenBadge: { color: COLORS.error, fontSize: 10, fontWeight: '600' },

  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  closeBtn: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  modalTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  modalContent: { flex: 1, padding: SPACING.md, gap: SPACING.md },

  detailSection: { gap: SPACING.sm },
  sectionTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  userDetail: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  detailAvatar: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden' },
  detailAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: 18 },
  detailName: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  detailEmail: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },

  contentBox: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  detailTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginTop: SPACING.sm },
  detailComment: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },

  imagesGrid: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  gridImage: { width: '48%', height: 100, borderRadius: BORDER_RADIUS.sm },

  repliesBox: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.md },
  replyItem: { backgroundColor: COLORS.background, padding: SPACING.sm, borderRadius: BORDER_RADIUS.sm, gap: SPACING.xs },
  replyUser: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  replyUserName: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  adminLabel: { color: COLORS.primary, fontSize: 10, fontWeight: '700' },
  replyItemText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },

  actionsSection: { gap: SPACING.sm, marginTop: SPACING.md },
  actionBtn: { paddingVertical: 12, borderRadius: BORDER_RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  approveBtn: { backgroundColor: COLORS.success + '20' },
  rejectBtn: { backgroundColor: COLORS.error + '20' },
  toggleBtn: { backgroundColor: COLORS.warning + '20' },
  replyActionBtn: { backgroundColor: COLORS.primary + '20' },
  deleteBtn: { backgroundColor: COLORS.error + '20' },
  actionBtnText: { color: COLORS.text, fontWeight: '700', fontSize: 13 },

  replySection: { gap: SPACING.sm, marginTop: SPACING.md },
  replyInputBox: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: 13, minHeight: 80, textAlignVertical: 'top' },
  charCount: { color: COLORS.textMuted, fontSize: 11, textAlign: 'right' },
  replyButtons: { flexDirection: 'row', gap: SPACING.md },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { color: COLORS.text, textAlign: 'center', fontWeight: '600' },
  submitBtn: { flex: 1, paddingVertical: 12, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.background, textAlign: 'center', fontWeight: '700' },
});
