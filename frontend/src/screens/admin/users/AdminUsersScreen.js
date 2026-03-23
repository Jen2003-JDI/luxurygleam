import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Image, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  fetchAllUsers, toggleUserStatus, deleteUser,
} from '../../../redux/slices/admin/adminUserSlice';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';

const ROLE_COLORS = { admin: COLORS.primary, user: COLORS.textSecondary };

export default function AdminUsersScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { users, loading, total } = useSelector((s) => s.adminUsers);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((reset = true) => {
    const p = reset ? 1 : page;
    if (reset) setPage(1);
    dispatch(fetchAllUsers({
      search,
      role: roleFilter || undefined,
      isActive: statusFilter !== '' ? statusFilter : undefined,
      page: p,
      limit: 15,
    }));
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => { load(true); }, [roleFilter, statusFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchAllUsers({ search, role: roleFilter || undefined, page: 1, limit: 15 }));
    setRefreshing(false);
  };

  const handleToggleStatus = (user) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    Alert.alert(
      `${user.isActive ? 'Deactivate' : 'Activate'} User`,
      `Are you sure you want to ${action} "${user.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user.isActive ? 'Deactivate' : 'Activate',
          style: user.isActive ? 'destructive' : 'default',
          onPress: async () => {
            const result = await dispatch(toggleUserStatus(user._id));
            if (toggleUserStatus.fulfilled.match(result)) {
              Toast.show({ type: 'success', text1: `User ${result.payload.isActive ? 'activated' : 'deactivated'}` });
            }
          },
        },
      ]
    );
  };

  const handleDelete = (user) => {
    Alert.alert(
      'Delete User',
      `Permanently delete "${user.name}"? This cannot be undone and will remove all their data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            const result = await dispatch(deleteUser(user._id));
            if (deleteUser.fulfilled.match(result)) {
              Toast.show({ type: 'success', text1: '✓ User deleted' });
            } else {
              Toast.show({ type: 'error', text1: result.payload || 'Delete failed' });
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={[styles.userCard, !item.isActive && styles.inactiveCard]}
      onPress={() => navigation.navigate('AdminUserDetail', { userId: item._id })}
      activeOpacity={0.85}
    >
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, !item.isActive && { opacity: 0.4 }]}>
            <Text style={styles.avatarLetter}>{item.name?.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.statusDot, { backgroundColor: item.isActive ? COLORS.success : COLORS.error }]} />
      </View>

      {/* Info */}
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.userName, !item.isActive && styles.inactiveText]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.role] + '22' }]}>
            <Text style={[styles.roleText, { color: ROLE_COLORS[item.role] }]}>
              {item.role.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
        <Text style={styles.userMeta}>
          {item.authProvider !== 'local' ? `via ${item.authProvider}  •  ` : ''}
          Joined {new Date(item.createdAt).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })}
        </Text>
      </View>

      {/* Quick actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: item.isActive ? '#3a1a1a' : '#1a3a1a' }]}
          onPress={() => handleToggleStatus(item)}
        >
          <Text style={{ fontSize: 14 }}>{item.isActive ? '🚫' : '✅'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#2a0a0a' }]}
          onPress={() => handleDelete(item)}
        >
          <Text style={{ fontSize: 14 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="MANAGE USERS"
        subtitle={`${total} total users`}
        onBack={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => load(true)}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); load(true); }}>
              <Text style={{ color: COLORS.textMuted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersRow}>
        {/* Role filter */}
        {[
          { label: 'All Roles', value: '' },
          { label: '👤 Users', value: 'user' },
          { label: '👑 Admins', value: 'admin' },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, roleFilter === opt.value && styles.chipActive]}
            onPress={() => setRoleFilter(opt.value)}
          >
            <Text style={[styles.chipText, roleFilter === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.chipDivider} />

        {/* Status filter */}
        {[
          { label: 'All', value: '' },
          { label: '✅ Active', value: 'true' },
          { label: '🚫 Inactive', value: 'false' },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, statusFilter === opt.value && styles.chipActive]}
            onPress={() => setStatusFilter(opt.value)}
          >
            <Text style={[styles.chipText, statusFilter === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.legendText}>Active</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
          <Text style={styles.legendText}>Inactive</Text>
        </View>
        <Text style={styles.legendHint}>Tap row to view details • Tap icons for quick actions</Text>
      </View>

      {/* List */}
      {loading && users.length === 0 ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={() => {
            if (page < Math.ceil(total / 15)) {
              setPage((p) => p + 1);
              dispatch(fetchAllUsers({ search, role: roleFilter || undefined, page: page + 1, limit: 15 }));
            }
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchSection: {
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, height: 44,
  },
  searchIcon: { fontSize: 15, marginRight: SPACING.sm },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  filtersRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.background, fontWeight: '700' },
  chipDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 2 },
  legendRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surface,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textMuted },
  legendHint: { fontSize: 10, color: COLORS.textMuted, flex: 1, textAlign: 'right' },
  list: { padding: SPACING.base, gap: SPACING.sm, paddingBottom: 30 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  inactiveCard: { opacity: 0.65, borderColor: COLORS.error + '44' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border },
  avatarPlaceholder: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primaryDark, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  avatarLetter: { fontSize: 20, color: COLORS.primary, fontWeight: '700' },
  statusDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: COLORS.card,
  },
  userInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  userName: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '600' },
  inactiveText: { color: COLORS.textMuted },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  roleText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  userEmail: { fontSize: 12, color: COLORS.textSecondary },
  userMeta: { fontSize: 11, color: COLORS.textMuted },
  actions: { gap: SPACING.xs },
  actionBtn: {
    width: 34, height: 34, borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  empty: { alignItems: 'center', padding: 60 },
  emptyEmoji: { fontSize: 54, marginBottom: SPACING.md },
  emptyTitle: { fontSize: 18, color: COLORS.text, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary },
});
