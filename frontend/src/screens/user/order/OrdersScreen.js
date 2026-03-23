import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchMyOrders } from '../../../redux/slices/user/orderSlice';
import { COLORS, SPACING, BORDER_RADIUS, STATUS_COLORS } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';

export default function OrdersScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { orders, loading } = useSelector((s) => s.orders);
  const [refreshing, setRefreshing] = useState(false);

  const refreshOrders = useCallback(async () => {
    await dispatch(fetchMyOrders());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      refreshOrders();
      const interval = setInterval(refreshOrders, 30000);
      return () => clearInterval(interval);
    }, [refreshOrders])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  }, [refreshOrders]);

  const goToOrderDetail = (orderId) => {
    navigation.navigate('HomeTabs', {
      screen: 'HomeTab',
      params: {
        screen: 'OrderDetail',
        params: { orderId },
      },
    });
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => goToOrderDetail(item._id)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item._id.slice(-8).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      <View style={styles.orderItems}>
        <Text style={styles.itemsText}>{item.orderItems?.length} item{item.orderItems?.length !== 1 ? 's' : ''}</Text>
        <Text style={styles.totalText}>₱{item.totalPrice?.toLocaleString()}</Text>
      </View>
      {item.orderItems?.slice(0, 2).map((oi, i) => (
        <Text key={i} style={styles.itemName} numberOfLines={1}>• {oi.name}</Text>
      ))}
      {item.orderItems?.length > 2 && (
        <Text style={styles.moreItems}>+{item.orderItems.length - 2} more items</Text>
      )}
      <Text style={styles.viewDetail}>View Details →</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="MY ORDERS" onBack={() => navigation.goBack()} />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.base, gap: SPACING.md },
  orderCard: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.xs },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, color: COLORS.text, fontWeight: '700', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
  statusText: { fontSize: 12, fontWeight: '700' },
  orderDate: { fontSize: 12, color: COLORS.textMuted },
  orderItems: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs },
  itemsText: { fontSize: 13, color: COLORS.textSecondary },
  totalText: { fontSize: 15, color: COLORS.primary, fontWeight: '700' },
  itemName: { fontSize: 12, color: COLORS.textSecondary },
  moreItems: { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic' },
  viewDetail: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: SPACING.xs },
  empty: { alignItems: 'center', padding: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: SPACING.lg },
  emptyTitle: { fontSize: 20, color: COLORS.text, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary },
});
