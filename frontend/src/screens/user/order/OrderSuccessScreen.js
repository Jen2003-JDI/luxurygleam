import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';

export default function OrderSuccessScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { order } = route.params || {};
  const orderId = order?._id?.toString().slice(-8).toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.successIcon}>✨</Text>
          <View style={styles.checkRing}>
            <Text style={styles.check}>✓</Text>
          </View>
        </View>

        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>Your luxury pieces are on their way</Text>

        <View style={styles.orderCard}>
          <Text style={styles.orderIdLabel}>ORDER ID</Text>
          <Text style={styles.orderId}>#{orderId}</Text>
          <View style={styles.divider} />
          <Text style={styles.orderMessage}>
            You'll receive a push notification when your order status changes.
            Check your orders to track delivery.
          </Text>
        </View>

        <View style={styles.stepsRow}>
          {['Order\nPlaced', 'Processing', 'Shipped', 'Delivered'].map((step, i) => (
            <View key={step} style={styles.stepItem}>
              <View style={[styles.stepDot, i === 0 && styles.stepDotActive]}>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, i === 0 && { color: COLORS.primary }]}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + SPACING.base }]}>
        <TouchableOpacity
          style={styles.viewOrderBtn}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={styles.viewOrderText}>VIEW MY ORDERS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => navigation.navigate('HomeTab', { screen: 'Home' })}
        >
          <Text style={styles.continueBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: SPACING.xl, alignItems: 'center', justifyContent: 'center', gap: SPACING.xl },
  iconContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: SPACING.md },
  successIcon: { fontSize: 80, opacity: 0.3, position: 'absolute' },
  checkRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surfaceLight },
  check: { fontSize: 36, color: COLORS.primary },
  title: { fontSize: 32, color: COLORS.text, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: -SPACING.md },
  orderCard: { width: '100%', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: SPACING.md },
  orderIdLabel: { fontSize: 11, color: COLORS.textSecondary, letterSpacing: 3, textTransform: 'uppercase' },
  orderId: { fontSize: 24, color: COLORS.primary, fontWeight: '700', letterSpacing: 2 },
  divider: { width: '100%', height: 1, backgroundColor: COLORS.border },
  orderMessage: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  stepsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.lg },
  stepItem: { alignItems: 'center', gap: 6, flex: 1 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNum: { fontSize: 13, color: COLORS.text, fontWeight: '700' },
  stepLabel: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center' },
  actions: { padding: SPACING.base, gap: SPACING.md },
  viewOrderBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, height: 54, justifyContent: 'center', alignItems: 'center' },
  viewOrderText: { color: COLORS.background, fontSize: 15, fontWeight: '700', letterSpacing: 1.5 },
  continueBtn: { alignItems: 'center', padding: SPACING.md },
  continueBtnText: { color: COLORS.textSecondary, fontSize: 14 },
});
