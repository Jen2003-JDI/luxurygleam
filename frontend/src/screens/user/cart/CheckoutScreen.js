import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { placeOrder } from '../../../redux/slices/user/orderSlice';
import { clearCart, selectCartItems } from '../../../redux/slices/user/cartSlice';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';

export default function CheckoutScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const { shippingFee = 150, subtotal = 0, total = 0 } = route.params || {};
  const cartItems = useSelector(selectCartItems);
  const { user } = useSelector((s) => s.auth);
  const { loading } = useSelector((s) => s.orders);

  const [form, setForm] = useState({
    fullName: user?.name || '',
    address: user?.address?.street || '',
    city: user?.address?.city || '',
    postalCode: user?.address?.zip || '',
    country: user?.address?.country || 'Philippines',
    phone: user?.phone || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handlePlaceOrder = async () => {
    if (!form.fullName || !form.address || !form.city || !form.postalCode || !form.phone)
      return Toast.show({ type: 'error', text1: 'Please fill all shipping fields' });

    const orderData = {
      orderItems: cartItems.map((item) => ({
        product: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      })),
      shippingAddress: form,
      paymentMethod,
      itemsPrice: subtotal,
      shippingPrice: shippingFee,
      taxPrice: 0,
      totalPrice: total,
    };

    const result = await dispatch(placeOrder(orderData));
    if (placeOrder.fulfilled.match(result)) {
      dispatch(clearCart());
      navigation.replace('OrderSuccess', { order: result.payload });
    } else {
      Toast.show({ type: 'error', text1: 'Order failed', text2: result.payload });
    }
  };

  const fields = [
    { key: 'fullName', label: 'Full Name', placeholder: 'Your full name' },
    { key: 'address', label: 'Street Address', placeholder: 'Street, Barangay' },
    { key: 'city', label: 'City / Municipality', placeholder: 'City' },
    { key: 'postalCode', label: 'Postal Code', placeholder: '0000', keyboard: 'numeric' },
    { key: 'country', label: 'Country', placeholder: 'Philippines' },
    { key: 'phone', label: 'Phone Number', placeholder: '+63 000 000 0000', keyboard: 'phone-pad' },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="CHECKOUT" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Shipping Address</Text>
          {fields.map((f) => (
            <View key={f.key} style={styles.inputGroup}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={f.placeholder}
                placeholderTextColor={COLORS.textMuted}
                value={form[f.key]}
                onChangeText={(v) => update(f.key, v)}
                keyboardType={f.keyboard || 'default'}
              />
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Payment Method</Text>
          {['COD', 'GCash', 'Bank Transfer'].map((method) => (
            <TouchableOpacity
              key={method}
              style={[styles.paymentOption, paymentMethod === method && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod(method)}
            >
              <View style={[styles.radio, paymentMethod === method && styles.radioActive]} />
              <Text style={[styles.paymentLabel, paymentMethod === method && { color: COLORS.primary }]}>
                {method === 'COD' ? '💵 Cash on Delivery' : method === 'GCash' ? '📱 GCash' : '🏦 Bank Transfer'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Order Summary</Text>
          {cartItems.map((item) => (
            <View key={item.productId} style={styles.orderItem}>
              <Text style={styles.orderItemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.orderItemQty}>x{item.quantity}</Text>
              <Text style={styles.orderItemPrice}>₱{(item.price * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>₱{subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping</Text>
            <Text style={[styles.totalValue, shippingFee === 0 && { color: COLORS.success }]}>
              {shippingFee === 0 ? 'FREE' : `₱${shippingFee}`}
            </Text>
          </View>
          <View style={[styles.totalRow, { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border }]}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>₱{total.toLocaleString()}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.placeOrderText}>PLACE ORDER — ₱{total.toLocaleString()}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, gap: SPACING.lg },
  section: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  sectionTitle: { fontSize: 16, color: COLORS.text, fontWeight: '700', marginBottom: SPACING.sm },
  inputGroup: { gap: 4 },
  label: { fontSize: 11, color: COLORS.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, color: COLORS.text, fontSize: 14,
  },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.sm, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  paymentOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceLight },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border },
  radioActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  paymentLabel: { fontSize: 15, color: COLORS.text },
  orderItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  orderItemName: { flex: 1, fontSize: 13, color: COLORS.text },
  orderItemQty: { fontSize: 13, color: COLORS.textSecondary },
  orderItemPrice: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 14, color: COLORS.textSecondary },
  totalValue: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  grandTotalLabel: { fontSize: 16, color: COLORS.text, fontWeight: '700', letterSpacing: 1 },
  grandTotalValue: { fontSize: 18, color: COLORS.primary, fontWeight: '700' },
  placeOrderBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, height: 56, justifyContent: 'center', alignItems: 'center' },
  placeOrderText: { color: COLORS.background, fontSize: 15, fontWeight: '700', letterSpacing: 1 },
});
