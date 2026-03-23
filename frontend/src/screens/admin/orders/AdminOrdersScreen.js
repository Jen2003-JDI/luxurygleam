import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { fetchAllOrders, updateOrderStatus } from '../../../redux/slices/user/orderSlice';
import { COLORS, SPACING, BORDER_RADIUS, STATUS_COLORS, ORDER_STATUSES } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import api from '../../../services/api';

export default function AdminOrdersScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { orders, loading } = useSelector((s) => s.orders);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoBody, setPromoBody] = useState('');
  const [promoModal, setPromoModal] = useState(false);
  const [sendingPromo, setSendingPromo] = useState(false);

  useEffect(() => { dispatch(fetchAllOrders()); }, []);

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === selectedOrder.status) {
      return Toast.show({ type: 'info', text1: 'Please select a different status' });
    }
    setUpdating(true);
    const result = await dispatch(updateOrderStatus({ id: selectedOrder._id, status: newStatus }));
    setUpdating(false);
    if (updateOrderStatus.fulfilled.match(result)) {
      Toast.show({ type: 'success', text1: `✓ Status updated to ${newStatus}`, text2: 'Push notification sent to customer' });
      setSelectedOrder(null);
    } else {
      Toast.show({ type: 'error', text1: 'Update failed', text2: result.payload });
    }
  };

  const handleSendPromo = async () => {
    if (!promoTitle || !promoBody) {
      return Toast.show({ type: 'error', text1: 'Please fill in title and message' });
    }
    setSendingPromo(true);
    try {
      await api.post('/notifications/promo', { title: promoTitle, body: promoBody });
      Toast.show({ type: 'success', text1: '📣 Promo sent to all users!' });
      setPromoModal(false);
      setPromoTitle('');
      setPromoBody('');
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to send promo', text2: err.response?.data?.message });
    }
    setSendingPromo(false);
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item._id.slice(-8).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || '#888') + '22' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || '#888' }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.customerName}>👤 {item.user?.name || 'Customer'}</Text>
      <Text style={styles.customerEmail}>{item.user?.email || ''}</Text>
      <Text style={styles.orderDate}>
        {new Date(item.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </Text>
      <View style={styles.orderMeta}>
        <Text style={styles.itemCount}>{item.orderItems?.length} item(s)</Text>
        <Text style={styles.orderTotal}>₱{item.totalPrice?.toLocaleString()}</Text>
      </View>
      <TouchableOpacity style={styles.updateBtn} onPress={() => openStatusModal(item)}>
        <Text style={styles.updateBtnText}>Update Status 📤</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="MANAGE ORDERS"
        onBack={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.promoBtn} onPress={() => setPromoModal(true)}>
            <Text style={styles.promoBtnText}>📣 Promo</Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>No orders yet</Text>
            </View>
          }
        />
      )}

      {/* ── Status Update Modal ───────────────────────────────── */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Order Status</Text>
            <Text style={styles.modalOrderId}>Order #{selectedOrder?._id?.slice(-8).toUpperCase()}</Text>
            <Text style={styles.modalCustomer}>Customer: {selectedOrder?.user?.name}</Text>

            <Text style={styles.pickerLabel}>Select New Status</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={newStatus}
                onValueChange={setNewStatus}
                style={styles.picker}
                dropdownIconColor={COLORS.primary}
              >
                {ORDER_STATUSES.map((s) => (
                  <Picker.Item key={s} label={s} value={s} color={COLORS.text} />
                ))}
              </Picker>
            </View>

            <View style={styles.notifNote}>
              <Text style={styles.notifNoteText}>
                📲 A push notification will be sent to the customer automatically
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedOrder(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleUpdateStatus} disabled={updating}>
                {updating
                  ? <ActivityIndicator color={COLORS.background} />
                  : <Text style={styles.confirmBtnText}>Update & Notify</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Promo Notification Modal ──────────────────────────── */}
      <Modal visible={promoModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📣 Send Promotion</Text>
            <Text style={styles.modalSubtitle}>Sends a push notification to ALL users</Text>

            <Text style={styles.pickerLabel}>Notification Title</Text>
            <TextInput
              style={styles.promoInput}
              placeholder="e.g. 50% Off All Rings Today!"
              placeholderTextColor={COLORS.textMuted}
              value={promoTitle}
              onChangeText={setPromoTitle}
            />

            <Text style={[styles.pickerLabel, { marginTop: SPACING.sm }]}>Message Body</Text>
            <TextInput
              style={[styles.promoInput, { height: 90, textAlignVertical: 'top' }]}
              placeholder="e.g. Shop our exclusive collection and save big..."
              placeholderTextColor={COLORS.textMuted}
              value={promoBody}
              onChangeText={setPromoBody}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPromoModal(false); setPromoTitle(''); setPromoBody(''); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSendPromo} disabled={sendingPromo}>
                {sendingPromo
                  ? <ActivityIndicator color={COLORS.background} />
                  : <Text style={styles.confirmBtnText}>Send Now</Text>}
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
  promoBtn: {
    backgroundColor: COLORS.primaryDark, paddingHorizontal: SPACING.md,
    paddingVertical: 6, borderRadius: BORDER_RADIUS.full,
  },
  promoBtnText: { color: COLORS.primaryLight, fontSize: 12, fontWeight: '700' },
  list: { padding: SPACING.base, gap: SPACING.md, paddingBottom: 30 },
  orderCard: {
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.xs,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, color: COLORS.text, fontWeight: '700', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
  statusText: { fontSize: 12, fontWeight: '700' },
  customerName: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  customerEmail: { fontSize: 11, color: COLORS.textMuted },
  orderDate: { fontSize: 11, color: COLORS.textMuted },
  orderMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs },
  itemCount: { fontSize: 13, color: COLORS.textSecondary },
  orderTotal: { fontSize: 15, color: COLORS.primary, fontWeight: '700' },
  updateBtn: {
    backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, alignItems: 'center', marginTop: SPACING.xs,
  },
  updateBtnText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  empty: { alignItems: 'center', padding: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING.xl, gap: SPACING.md, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, color: COLORS.text, fontWeight: '700' },
  modalOrderId: { fontSize: 15, color: COLORS.primary, fontWeight: '600', letterSpacing: 1 },
  modalCustomer: { fontSize: 14, color: COLORS.textSecondary },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  pickerLabel: { fontSize: 12, color: COLORS.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  pickerWrapper: {
    backgroundColor: COLORS.inputBg, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, overflow: 'hidden',
  },
  picker: { color: COLORS.text, height: 50 },
  notifNote: {
    backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  notifNoteText: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  confirmBtn: {
    flex: 2, backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center',
  },
  confirmBtnText: { color: COLORS.background, fontWeight: '700', fontSize: 14 },
  promoInput: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, color: COLORS.text, fontSize: 14,
  },
});
