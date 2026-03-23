import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Main Tab Navigator ────────────────────────────────────────────
import MainTabNavigator from './MainTabNavigator';

// ── User Screens ──────────────────────────────────────────────────
import ProfileScreen from '../screens/user/profile/ProfileScreen';
import OrdersScreen from '../screens/user/order/OrdersScreen';
import NotificationsScreen from '../screens/user/notification/NotificationsScreen';

// ── Admin Screens ─────────────────────────────────────────────────
import AdminSalesDashboardScreen from '../screens/admin/dashboard/AdminSalesDashboardScreen';
import AdminProductsScreen from '../screens/admin/products/AdminProductsScreen';
import AdminOrdersScreen from '../screens/admin/orders/AdminOrdersScreen';
import AdminUsersScreen from '../screens/admin/users/AdminUsersScreen';
import AdminUserDetailScreen from '../screens/admin/users/AdminUserDetailScreen';
import AdminReviewsScreen from '../screens/admin/reviews/AdminReviewsScreen';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { logout } from '../redux/slices/user/authSlice';

const Drawer = createDrawerNavigator();

function CustomDrawerContent({ navigation }) {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const menuItems = [
    ...(user?.role === 'admin' 
      ? [{ label: 'Dashboard', icon: '📊', screen: 'HomeTabs' }]
      : [{ label: 'Home', icon: '🏠', screen: 'HomeTabs' }]
    ),
    { label: 'My Profile', icon: '👤', screen: 'Profile' },
    ...(user?.role !== 'admin' ? [{ label: 'My Orders', icon: '📦', screen: 'Orders' }] : []),
    { label: 'Notifications', icon: '🔔', screen: 'Notifications' },
    ...(user?.role === 'admin' ? [
      { label: 'Manage Products', icon: '💎', screen: 'AdminProducts' },
      { label: 'Manage Orders', icon: '📋', screen: 'AdminOrders' },
      { label: 'Manage Reviews', icon: '⭐', screen: 'AdminReviews' },
      { label: 'Manage Users', icon: '👥', screen: 'AdminUsers' },
    ] : []),
  ];

  return (
    <View style={[styles.drawerContainer, { paddingTop: insets.top + 20 }]}>
      {/* Brand Header */}
      <View style={styles.drawerHeader}>
        <View style={styles.goldLine} />
        <Text style={styles.brandName}>LUXURY GLEAM</Text>
        <Text style={styles.brandTagline}>Fine Jewelry & More</Text>
        <View style={styles.goldLine} />
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>{user?.name?.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.avatarRing} />
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {user?.role === 'admin' && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        )}
      </View>

      {/* Menu Items */}
      <ScrollView
        style={styles.menuItems}
        contentContainerStyle={styles.menuItemsContent}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.drawerFooter}>
        <Text style={styles.footerText}>© 2024 Luxury Gleam</Text>
      </View>
    </View>
  );
}

export default function DrawerNavigator() {
  const { user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === 'admin';
  const HomeComponent = isAdmin ? AdminSalesDashboardScreen : MainTabNavigator;

  return (
    <Drawer.Navigator
      key={isAdmin ? 'admin-drawer' : 'user-drawer'}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: COLORS.surface, width: 290 },
      }}
      initialRouteName="HomeTabs"
    >
      {/* ── Default Home (User or Admin) ─────────────────────────── */}
      <Drawer.Screen name="HomeTabs" component={HomeComponent} />

      {/* ── User Screens ─────────────────────────────────────────── */}
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      {!isAdmin && <Drawer.Screen name="Orders" component={OrdersScreen} />}
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />

      {/* ── Admin Screens ────────────────────────────────────────── */}
      <Drawer.Screen name="AdminProducts" component={AdminProductsScreen} />
      <Drawer.Screen name="AdminOrders" component={AdminOrdersScreen} />
      <Drawer.Screen name="AdminReviews" component={AdminReviewsScreen} />
      <Drawer.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Drawer.Screen name="AdminUserDetail" component={AdminUserDetailScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1, backgroundColor: COLORS.surface, paddingBottom: 30 },
  drawerHeader: { alignItems: 'center', paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg },
  goldLine: { width: '100%', height: 1, backgroundColor: COLORS.primary, marginVertical: SPACING.sm },
  brandName: { fontSize: 22, fontFamily: FONTS.heading, color: COLORS.primary, letterSpacing: 4, fontWeight: '700', marginVertical: SPACING.xs },
  brandTagline: { fontSize: 11, color: COLORS.textSecondary, letterSpacing: 2, textTransform: 'uppercase' },
  userSection: { alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.xl },
  avatarContainer: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryDark, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 30, color: COLORS.primary, fontWeight: '700' },
  avatarRing: { position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 46, borderWidth: 2, borderColor: COLORS.primary },
  userName: { fontSize: 18, color: COLORS.text, fontWeight: '600', marginBottom: 4 },
  userEmail: { fontSize: 12, color: COLORS.textSecondary },
  adminBadge: { marginTop: 8, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 20 },
  adminBadgeText: { fontSize: 10, color: COLORS.background, fontWeight: '700', letterSpacing: 2 },
  menuItems: { flex: 1, paddingHorizontal: SPACING.lg },
  menuItemsContent: { paddingBottom: SPACING.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { fontSize: 20, marginRight: SPACING.md },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.text, letterSpacing: 0.5 },
  menuArrow: { fontSize: 20, color: COLORS.primary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
  },
  logoutIcon: { fontSize: 18, marginRight: SPACING.md },
  logoutText: { fontSize: 15, color: COLORS.error },
  drawerFooter: { alignItems: 'center', marginTop: SPACING.sm },
  footerText: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 1 },
});
