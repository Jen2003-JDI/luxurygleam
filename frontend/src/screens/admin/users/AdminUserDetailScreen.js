import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import {
  fetchUserById, updateUser, updateUserRole,
  toggleUserStatus, deleteUser, clearSelectedUser,
} from '../../../redux/slices/admin/adminUserSlice';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';

export default function AdminUserDetailScreen({ route, navigation }) {
  const { userId } = route.params;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { selectedUser: user, selectedUserStats: stats, loading, actionLoading } = useSelector((s) => s.adminUsers);

  const [editModal, setEditModal] = useState(false);
  const [roleModal, setRoleModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [newRole, setNewRole] = useState('user');

  useEffect(() => {
    dispatch(fetchUserById(userId));
    return () => { dispatch(clearSelectedUser()); };
  }, [userId]);

  useEffect(() => {
    if (user) {
      setEditForm({ name: user.name || '', phone: user.phone || '' });
      setNewRole(user.role);
    }
  }, [user]);

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) return Toast.show({ type: 'error', text1: 'Name is required' });
    const result = await dispatch(updateUser({ id: userId, name: editForm.name, phone: editForm.phone }));
    if (updateUser.fulfilled.match(result)) {
      Toast.show({ type: 'success', text1: '✓ User info updated' });
      setEditModal(false);
    } else {
      Toast.show({ type: 'error', text1: result.payload || 'Update failed' });
    }
  };

  const handleSaveRole = async () => {
    if (newRole === user.role) { setRoleModal(false); return; }
    const result = await dispatch(updateUserRole({ id: userId, role: newRole }));
    if (updateUserRole.fulfilled.match(result)) {
      Toast.show({ type: 'success', text1: `✓ Role changed to ${newRole}` });
      setRoleModal(false);
    } else {
      Toast.show({ type: 'error', text1: result.payload || 'Role update failed' });
    }
  };

  const handleToggleStatus = () => {
    const action = user.isActive ? 'deactivate' : 'activate';
    Alert.alert(
      `${user.isActive ? 'Deactivate' : 'Activate'} Account`,
      `Are you sure you want to ${action} ${user.name}'s account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user.isActive ? 'Deactivate' : 'Activate',
          style: user.isActive ? 'destructive' : 'default',
          onPress: async () => {
            const result = await dispatch(toggleUserStatus(userId));
            if (toggleUserStatus.fulfilled.match(result)) {
              Toast.show({ type: 'success', text1: `User ${result.payload.isActive ? 'activated' : 'deactivated'}` });
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete User',
      `Permanently delete "${user.name}"? This will remove their account completely and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            const result = await dispatch(deleteUser(userId));
            if (deleteUser.fulfilled.match(result)) {
              Toast.show({ type: 'success', text1: '✓ User permanently deleted' });
              navigation.goBack();
            } else {
              Toast.show({ type: 'error', text1: result.payload || 'Delete failed' });
            }
          },
        },
      ]
    );
  };

  if (loading || !user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="USER DETAILS" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="USER DETAILS" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Profile Header ─────────────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{user.name?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={[styles.statusBadgeAbsolute, { backgroundColor: user.isActive ? COLORS.success : COLORS.error }]}>
              <Text style={styles.statusBadgeText}>{user.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>

          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>

          <View style={styles.badgesRow}>
            <View style={[styles.roleBadge, { backgroundColor: user.role === 'admin' ? COLORS.primary + '33' : COLORS.surfaceLight }]}>
              <Text style={[styles.roleText, { color: user.role === 'admin' ? COLORS.primary : COLORS.textSecondary }]}>
                {user.role === 'admin' ? '👑 ADMIN' : '👤 USER'}
              </Text>
            </View>
            {user.authProvider !== 'local' && (
              <View style={styles.providerBadge}>
                <Text style={styles.providerText}>
                  {user.authProvider === 'google' ? '🔵 Google' : '🔷 Facebook'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Stats Cards ────────────────────────────────────────── */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.deliveredOrders}</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: COLORS.primary, fontSize: 15 }]}>
                ₱{stats.totalSpent.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
        )}

        {/* ── Account Info ───────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Account Information</Text>
          <InfoRow label="Full Name" value={user.name} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Phone" value={user.phone || '—'} />
          <InfoRow label="Auth Method" value={user.authProvider?.charAt(0).toUpperCase() + user.authProvider?.slice(1)} />
          <InfoRow label="Member Since" value={new Date(user.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })} />
          <InfoRow label="Last Updated" value={new Date(user.updatedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })} />
          <InfoRow label="Push Tokens" value={`${user.expoPushTokens?.length || 0} device(s) registered`} />
        </View>

        {/* ── Address ────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Address</Text>
          {user.address?.street || user.address?.city ? (
            <>
              <InfoRow label="Street" value={user.address?.street || '—'} />
              <InfoRow label="City" value={user.address?.city || '—'} />
              <InfoRow label="State" value={user.address?.state || '—'} />
              <InfoRow label="ZIP" value={user.address?.zip || '—'} />
              <InfoRow label="Country" value={user.address?.country || '—'} />
            </>
          ) : (
            <Text style={styles.noAddress}>No address on file</Text>
          )}
        </View>

        {/* ── Admin Actions ──────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚙️ Admin Actions</Text>

          <TouchableOpacity style={styles.actionRow} onPress={() => setEditModal(true)}>
            <Text style={styles.actionIcon}>✏️</Text>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionLabel}>Edit User Info</Text>
              <Text style={styles.actionSubtext}>Update name and phone number</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={() => setRoleModal(true)}>
            <Text style={styles.actionIcon}>🏷️</Text>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionLabel}>Change Role</Text>
              <Text style={styles.actionSubtext}>Current: {user.role.toUpperCase()}</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomWidth: 0 }]}
            onPress={handleToggleStatus}
            disabled={actionLoading}
          >
            <Text style={styles.actionIcon}>{user.isActive ? '🚫' : '✅'}</Text>
            <View style={styles.actionTextCol}>
              <Text style={[styles.actionLabel, { color: user.isActive ? COLORS.warning : COLORS.success }]}>
                {user.isActive ? 'Deactivate Account' : 'Activate Account'}
              </Text>
              <Text style={styles.actionSubtext}>
                {user.isActive ? 'Block user from logging in' : 'Restore user access'}
              </Text>
            </View>
            {actionLoading ? <ActivityIndicator color={COLORS.primary} size="small" /> : <Text style={styles.actionArrow}>›</Text>}
          </TouchableOpacity>
        </View>

        {/* ── Danger Zone ────────────────────────────────────────── */}
        <View style={[styles.card, styles.dangerCard]}>
          <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
          <Text style={styles.dangerSubtext}>
            Permanently deleting a user cannot be undone. All their data will be removed.
          </Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>🗑️ Delete User Permanently</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Edit Info Modal ─────────────────────────────────────── */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit User Info</Text>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={editForm.name}
              onChangeText={(v) => setEditForm((p) => ({ ...p, name: v }))}
              placeholder="Full name"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Phone Number</Text>
            <TextInput
              style={styles.fieldInput}
              value={editForm.phone}
              onChangeText={(v) => setEditForm((p) => ({ ...p, phone: v }))}
              placeholder="Phone number"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit} disabled={actionLoading}>
                {actionLoading
                  ? <ActivityIndicator color={COLORS.background} />
                  : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Change Role Modal ───────────────────────────────────── */}
      <Modal visible={roleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change User Role</Text>
            <Text style={styles.modalSubtext}>
              Granting admin access gives full control over products, orders, and users.
            </Text>

            <View style={styles.rolePicker}>
              <Picker
                selectedValue={newRole}
                onValueChange={setNewRole}
                style={{ color: COLORS.text }}
                dropdownIconColor={COLORS.primary}
              >
                <Picker.Item label="👤 User — Standard access" value="user" color={COLORS.text} />
                <Picker.Item label="👑 Admin — Full access" value="admin" color={COLORS.text} />
              </Picker>
            </View>

            {newRole === 'admin' && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Admin users can manage all products, orders, users and send notifications.
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRoleModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveRole} disabled={actionLoading}>
                {actionLoading
                  ? <ActivityIndicator color={COLORS.background} />
                  : <Text style={styles.saveBtnText}>Update Role</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.border + '88' }}>
      <Text style={{ flex: 1, fontSize: 12, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ flex: 2, fontSize: 13, color: COLORS.text, fontWeight: '500', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, gap: SPACING.md, paddingBottom: 20 },

  // Profile card
  profileCard: {
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm,
  },
  avatarSection: { position: 'relative', marginBottom: SPACING.sm },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: COLORS.primary },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primaryDark, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.primary,
  },
  avatarLetter: { fontSize: 36, color: COLORS.primary, fontWeight: '700' },
  statusBadgeAbsolute: {
    position: 'absolute', bottom: 0, right: -4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: BORDER_RADIUS.full,
  },
  statusBadgeText: { fontSize: 10, color: COLORS.white, fontWeight: '700' },
  profileName: { fontSize: 22, color: COLORS.text, fontWeight: '700' },
  profileEmail: { fontSize: 13, color: COLORS.textSecondary },
  badgesRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', justifyContent: 'center', marginTop: SPACING.xs },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: BORDER_RADIUS.full },
  roleText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  providerBadge: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  providerText: { fontSize: 12, color: COLORS.textSecondary },

  // Stats
  statsRow: { flexDirection: 'row', gap: SPACING.md },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 4,
  },
  statValue: { fontSize: 20, color: COLORS.text, fontWeight: '700' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },

  // Info card
  card: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 15, color: COLORS.text, fontWeight: '700', marginBottom: SPACING.sm },
  noAddress: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },

  // Action rows
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  actionIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  actionTextCol: { flex: 1 },
  actionLabel: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  actionSubtext: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  actionArrow: { fontSize: 22, color: COLORS.primary },

  // Danger zone
  dangerCard: { borderColor: COLORS.error + '44' },
  dangerTitle: { fontSize: 15, color: COLORS.error, fontWeight: '700', marginBottom: SPACING.sm },
  dangerSubtext: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md, lineHeight: 20 },
  deleteBtn: {
    backgroundColor: '#3a0a0a', borderWidth: 1, borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center',
  },
  deleteBtnText: { color: COLORS.error, fontSize: 14, fontWeight: '700' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING.xl, gap: SPACING.sm, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, color: COLORS.text, fontWeight: '700' },
  modalSubtext: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  fieldLabel: { fontSize: 11, color: COLORS.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  fieldInput: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, color: COLORS.text, fontSize: 14,
  },
  rolePicker: {
    backgroundColor: COLORS.inputBg, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, overflow: 'hidden', marginVertical: SPACING.sm,
  },
  warningBox: {
    backgroundColor: '#3a2a00', borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.warning,
  },
  warningText: { fontSize: 12, color: COLORS.warning, lineHeight: 18 },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  saveBtn: {
    flex: 2, backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center',
  },
  saveBtnText: { color: COLORS.background, fontWeight: '700', fontSize: 14 },
});
