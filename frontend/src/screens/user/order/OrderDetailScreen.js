import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { fetchOrder } from '../../../redux/slices/user/orderSlice';
import { checkCanReview } from '../../../redux/slices/user/reviewSlice';
import { COLORS, SPACING, BORDER_RADIUS, STATUS_COLORS, ORDER_STATUSES } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { exportOrderReceipt } from '../../../services/pdfReceiptService';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { selectedOrder: order, loading } = useSelector((s) => s.orders);
  const { user } = useSelector((s) => s.auth);
  const [exporting, setExporting] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const refreshOrderData = useCallback(async () => {
    if (!orderId) return;
    await dispatch(fetchOrder(orderId));
  }, [dispatch, orderId]);

  useFocusEffect(
    useCallback(() => {
      refreshOrderData();
      const interval = setInterval(refreshOrderData, 30000);
      return () => clearInterval(interval);
    }, [refreshOrderData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshOrderData();
    setRefreshing(false);
  }, [refreshOrderData]);

  useEffect(() => {
    const loadReviewEligibility = async () => {
      if (!order?._id || order.status !== 'Delivered' || !Array.isArray(order.orderItems) || !order.orderItems.length) return;
      const entries = await Promise.all(order.orderItems.map(async (item) => {
        const productId = typeof item.product === 'object' ? item.product?._id : item.product;
        if (!productId) return [null, { canReview: false, alreadyReviewed: false }];
        const action = await dispatch(checkCanReview({ productId, orderId: order._id }));
        if (checkCanReview.fulfilled.match(action)) {
          return [productId, {
            canReview: !!action.payload.canReview,
            alreadyReviewed: !!action.payload.alreadyReviewed,
          }];
        }
        return [productId, { canReview: false, alreadyReviewed: false }];
      }));
      const next = {};
      entries.forEach(([pid, value]) => {
        if (pid) next[pid] = value;
      });
      setReviewEligibility(next);
    };

    loadReviewEligibility();
  }, [order?._id, order?.status, order?.orderItems, dispatch]);

  const handleExportPDF = async () => {
    if (!order) return;
    setExporting(true);
    try {
      await exportOrderReceipt(order, user);
      Toast.show({ type: 'success', text1: '📄 Receipt exported!', text2: 'PDF saved and ready to share' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Export failed', text2: err.message || 'Could not generate PDF' });
    } finally {
      setExporting(false);
    }
  };

  if (loading || !order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="ORDER DETAILS" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  const currentIdx = ORDER_STATUSES.indexOf(order.status);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="ORDER DETAILS" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Order ID & Status */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Order ID</Text>
            <Text style={styles.value}>#{order._id.slice(-8).toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{new Date(order.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] + '22' }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>{order.status}</Text>
            </View>
          </View>
        </View>

        {/* Status Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Progress</Text>
          <View style={styles.progressContainer}>
            {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, i) => {
              const stepIdx = ORDER_STATUSES.indexOf(step);
              const done = stepIdx <= currentIdx && order.status !== 'Cancelled';
              return (
                <View key={step} style={styles.progressStep}>
                  <View style={[styles.progressDot, done && styles.progressDotDone]}>
                    <Text style={styles.progressDotText}>{done ? '✓' : i + 1}</Text>
                  </View>
                  <Text style={[styles.progressLabel, done && { color: COLORS.primary }]}>{step}</Text>
                  {i < 3 && <View style={[styles.progressLine, done && styles.progressLineDone]} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items Ordered</Text>
          {order.orderItems?.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                {order.status === 'Delivered' && (() => {
                  const productId = typeof item.product === 'object' ? item.product?._id : item.product;
                  const eligibility = productId ? reviewEligibility[productId] : null;

                  if (eligibility?.canReview) {
                    return (
                      <TouchableOpacity
                        style={styles.reviewActionBtn}
                        onPress={() => navigation.navigate('WriteReview', {
                          productId,
                          orderId: order._id,
                          productName: item.name,
                        })}
                      >
                        <Text style={styles.reviewActionBtnText}>Write Review</Text>
                      </TouchableOpacity>
                    );
                  }

                  if (eligibility?.alreadyReviewed) {
                    return (
                      <TouchableOpacity
                        style={[styles.reviewActionBtn, styles.reviewedBtn]}
                        onPress={() => navigation.navigate('Reviews', {
                          productId,
                          productName: item.name,
                        })}
                      >
                        <Text style={styles.reviewActionBtnText}>View Reviews</Text>
                      </TouchableOpacity>
                    );
                  }

                  return null;
                })()}
              </View>
              <Text style={styles.itemPrice}>₱{(item.price * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Shipping Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Shipping Address</Text>
          <Text style={styles.addressText}>{order.shippingAddress?.fullName}</Text>
          <Text style={styles.addressText}>{order.shippingAddress?.address}</Text>
          <Text style={styles.addressText}>{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</Text>
          <Text style={styles.addressText}>{order.shippingAddress?.country}</Text>
          <Text style={styles.addressText}>📞 {order.shippingAddress?.phone}</Text>
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💳 Payment Summary</Text>
          <View style={styles.row}><Text style={styles.label}>Method</Text><Text style={styles.value}>{order.paymentMethod}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Subtotal</Text><Text style={styles.value}>₱{order.itemsPrice?.toLocaleString()}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Shipping</Text><Text style={styles.value}>₱{order.shippingPrice?.toLocaleString()}</Text></View>
          <View style={[styles.row, styles.totalBorder]}>
            <Text style={[styles.label, { fontWeight: '700', color: COLORS.text }]}>TOTAL</Text>
            <Text style={[styles.value, { color: COLORS.primary, fontSize: 18, fontWeight: '700' }]}>₱{order.totalPrice?.toLocaleString()}</Text>
          </View>
        </View>

        {/* Status History */}
        {order.statusHistory?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Status History</Text>
            {order.statusHistory.map((h, i) => (
              <View key={i} style={styles.historyRow}>
                <View style={[styles.histDot, { backgroundColor: STATUS_COLORS[h.status] || COLORS.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.histStatus}>{h.status}</Text>
                  {h.note ? <Text style={styles.histNote}>{h.note}</Text> : null}
                  <Text style={styles.histDate}>{new Date(h.updatedAt).toLocaleString('en-PH')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Export PDF Receipt */}
        <TouchableOpacity
          style={[styles.exportBtn, exporting && styles.exportBtnLoading]}
          onPress={handleExportPDF}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color={COLORS.background} size="small" />
          ) : (
            <>
              <Text style={styles.exportBtnIcon}>📄</Text>
              <Text style={styles.exportBtnText}>EXPORT PDF RECEIPT</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.primaryDark,
    borderRadius: BORDER_RADIUS.md, height: 52,
    borderWidth: 1, borderColor: COLORS.primary, marginHorizontal: SPACING.base,
  },
  exportBtnLoading: { opacity: 0.7 },
  exportBtnIcon: { fontSize: 18 },
  exportBtnText: { color: COLORS.primaryLight, fontSize: 14, fontWeight: '700', letterSpacing: 1.5 },
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, gap: SPACING.md },
  card: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  cardTitle: { fontSize: 15, color: COLORS.text, fontWeight: '700', marginBottom: SPACING.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, color: COLORS.textSecondary },
  value: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
  statusText: { fontSize: 12, fontWeight: '700' },
  progressContainer: { flexDirection: 'row', alignItems: 'flex-start', marginTop: SPACING.sm },
  progressStep: { flex: 1, alignItems: 'center', position: 'relative' },
  progressDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  progressDotDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  progressDotText: { fontSize: 11, color: COLORS.text, fontWeight: '700' },
  progressLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  progressLine: { position: 'absolute', top: 14, left: '50%', right: '-50%', height: 2, backgroundColor: COLORS.border },
  progressLineDone: { backgroundColor: COLORS.primary },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs },
  itemImage: { width: 56, height: 56, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.surfaceLight },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  itemQty: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  reviewActionBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary + '22',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  reviewedBtn: {
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.border,
  },
  reviewActionBtnText: { fontSize: 11, color: COLORS.primary, fontWeight: '700', letterSpacing: 0.5 },
  itemPrice: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  addressText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 22 },
  totalBorder: { paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: SPACING.xs },
  historyRow: { flexDirection: 'row', gap: SPACING.sm, paddingVertical: SPACING.xs },
  histDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  histStatus: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  histNote: { fontSize: 12, color: COLORS.textSecondary },
  histDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
