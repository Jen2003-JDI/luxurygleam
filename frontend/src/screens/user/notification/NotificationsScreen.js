import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchNotifications, markNotificationRead, markAllNotificationsRead,
} from '../../../redux/slices/user/notificationSlice';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';

const TYPE_ICONS = { order: '📦', promotion: '🎁', discount: '💰', system: '🔔' };
const TYPE_COLORS = { order: COLORS.primary, promotion: '#E07A30', discount: COLORS.success, system: COLORS.textSecondary };

export default function NotificationsScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { notifications, loading } = useSelector((s) => s.notifications);
  const [refreshing, setRefreshing] = useState(false);

  const refreshNotifications = useCallback(async () => {
    await dispatch(fetchNotifications());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 30000);
      return () => clearInterval(interval);
    }, [refreshNotifications])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  }, [refreshNotifications]);

  const handlePress = (notif) => {
    if (!notif.isRead) dispatch(markNotificationRead(notif._id));
    if (notif.type === 'order' && notif.data?.orderId) {
      navigation.navigate('HomeTabs', {
        screen: 'HomeTab',
        params: {
          screen: 'OrderDetail',
          params: { orderId: notif.data.orderId },
        },
      });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notifCard, !item.isRead && styles.unreadCard]}
      onPress={() => handlePress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBubble, { backgroundColor: TYPE_COLORS[item.type] + '22' }]}>
        <Text style={styles.typeIcon}>{TYPE_ICONS[item.type] || '🔔'}</Text>
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="NOTIFICATIONS"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        onBack={() => navigation.goBack()}
        rightComponent={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={() => dispatch(markAllNotificationsRead())} style={{ padding: SPACING.sm }}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
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
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>We'll notify you about your orders and promotions</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.base, gap: SPACING.sm },
  notifCard: {
    flexDirection: 'row', gap: SPACING.md, backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  unreadCard: { borderColor: COLORS.primary + '44', backgroundColor: COLORS.surfaceLight },
  iconBubble: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  typeIcon: { fontSize: 22 },
  notifContent: { flex: 1, gap: 4 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  notifTitle: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  notifBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  notifTime: { fontSize: 11, color: COLORS.textMuted },
  markAllText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  empty: { alignItems: 'center', padding: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: SPACING.lg },
  emptyTitle: { fontSize: 20, color: COLORS.text, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});
