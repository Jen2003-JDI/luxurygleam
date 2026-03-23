import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateCartQty, removeFromCart, clearCart, selectCartItems, selectCartTotal } from '../../../redux/slices/user/cartSlice';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';

export default function CartScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Remove all items from cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => dispatch(clearCart()) },
    ]);
  };

  const shippingFee = total >= 5000 ? 0 : 150;
  const grandTotal = total + shippingFee;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="MY CART"
        subtitle={`${items.length} item${items.length !== 1 ? 's' : ''}`}
        onBack={() => navigation.goBack()}
        rightComponent={items.length > 0 ? (
          <TouchableOpacity onPress={handleClearCart} style={{ padding: SPACING.sm }}>
            <Text style={{ color: COLORS.error, fontSize: 13 }}>Clear All</Text>
          </TouchableOpacity>
        ) : null}
      />

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>Add some luxurious pieces to your cart</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('HomeTab')}>
            <Text style={styles.shopBtnText}>BROWSE JEWELRY</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <SwipeListView
            data={items}
            keyExtractor={(item) => item.productId}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₱{item.price.toLocaleString()}</Text>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => dispatch(updateCartQty({ productId: item.productId, quantity: item.quantity - 1 }))}
                    >
                      <Text style={styles.qtyBtnText}>{item.quantity === 1 ? '🗑️' : '−'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => dispatch(updateCartQty({ productId: item.productId, quantity: Math.min(item.stock, item.quantity + 1) }))}
                      disabled={item.quantity >= item.stock}
                    >
                      <Text style={[styles.qtyBtnText, item.quantity >= item.stock && { color: COLORS.textMuted }]}>+</Text>
                    </TouchableOpacity>
                    <Text style={styles.itemTotal}>₱{(item.price * item.quantity).toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            )}
            renderHiddenItem={({ item }) => (
              <View style={styles.hiddenRow}>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => dispatch(removeFromCart(item.productId))}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                  <Text style={styles.deleteText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
            rightOpenValue={-90}
            disableRightSwipe
          />

          {/* Order Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₱{total.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={[styles.summaryValue, shippingFee === 0 && { color: COLORS.success }]}>
                {shippingFee === 0 ? 'FREE' : `₱${shippingFee}`}
              </Text>
            </View>
            {shippingFee > 0 && (
              <Text style={styles.freeShippingHint}>
                Add ₱{(5000 - total).toLocaleString()} more for free shipping
              </Text>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₱{grandTotal.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => navigation.navigate('Checkout', { shippingFee, subtotal: total, total: grandTotal })}
            >
              <Text style={styles.checkoutBtnText}>PROCEED TO CHECKOUT</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: SPACING.lg },
  emptyTitle: { fontSize: 22, color: COLORS.text, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
  shopBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 14, paddingHorizontal: 30 },
  shopBtnText: { color: COLORS.background, fontWeight: '700', letterSpacing: 1.5 },
  list: { padding: SPACING.base, gap: SPACING.md },
  cartItem: {
    flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  itemImage: { width: 100, height: 100 },
  itemInfo: { flex: 1, padding: SPACING.sm, justifyContent: 'space-between' },
  itemName: { fontSize: 14, color: COLORS.text, fontWeight: '600', lineHeight: 20 },
  itemPrice: { fontSize: 13, color: COLORS.primary },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 16, color: COLORS.text },
  qtyValue: { fontSize: 15, color: COLORS.text, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  itemTotal: { marginLeft: 'auto', fontSize: 15, color: COLORS.primary, fontWeight: '700' },
  hiddenRow: { flex: 1, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center', borderRadius: BORDER_RADIUS.md, overflow: 'hidden' },
  deleteBtn: { width: 90, height: '100%', backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center' },
  deleteIcon: { fontSize: 20 },
  deleteText: { fontSize: 11, color: COLORS.white, fontWeight: '600', marginTop: 2 },
  summary: { backgroundColor: COLORS.surface, padding: SPACING.base, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, color: COLORS.textSecondary },
  summaryValue: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  freeShippingHint: { fontSize: 11, color: COLORS.warning, textAlign: 'center' },
  totalRow: { paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalLabel: { fontSize: 16, color: COLORS.text, fontWeight: '700' },
  totalValue: { fontSize: 18, color: COLORS.primary, fontWeight: '700' },
  checkoutBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.sm },
  checkoutBtnText: { color: COLORS.background, fontSize: 15, fontWeight: '700', letterSpacing: 1.5 },
});
