import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';

// ── User Screens ──────────────────────────────────────────────────
import HomeScreen from '../screens/user/product/HomeScreen';
import SearchScreen from '../screens/user/search/SearchScreen';
import CartScreen from '../screens/user/cart/CartScreen';
import CheckoutScreen from '../screens/user/cart/CheckoutScreen';
import OrderSuccessScreen from '../screens/user/order/OrderSuccessScreen';
import ProductDetailScreen from '../screens/user/product/ProductDetailScreen';
import OrderDetailScreen from '../screens/user/order/OrderDetailScreen';
import WriteReviewScreen from '../screens/user/review/WriteReviewScreen';
import ReviewsScreen from '../screens/user/review/ReviewsScreen';

import { COLORS } from '../constants/theme';
import { selectCartCount } from '../redux/slices/user/cartSlice';
import { selectUnreadCount } from '../redux/slices/user/notificationSlice';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const CartStack = createStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <HomeStack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <HomeStack.Screen name="WriteReview" component={WriteReviewScreen} />
      <HomeStack.Screen name="Reviews" component={ReviewsScreen} />
    </HomeStack.Navigator>
  );
}

function CartStackNavigator() {
  return (
    <CartStack.Navigator screenOptions={{ headerShown: false }}>
      <CartStack.Screen name="Cart" component={CartScreen} />
      <CartStack.Screen name="Checkout" component={CheckoutScreen} />
      <CartStack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
    </CartStack.Navigator>
  );
}

const TabIcon = ({ emoji, badge }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 22 }}>{emoji}</Text>
    {badge > 0 && (
      <View style={{
        position: 'absolute', top: -4, right: -10,
        backgroundColor: COLORS.primary, borderRadius: 10,
        minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
      }}>
        <Text style={{ color: COLORS.background, fontSize: 10, fontWeight: '700' }}>
          {badge > 99 ? '99+' : badge}
        </Text>
      </View>
    )}
  </View>
);

export default function MainTabNavigator() {
  const cartCount = useSelector(selectCartCount);
  const notifCount = useSelector(selectUnreadCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 0.5 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Home', tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{ title: 'Search', tabBarIcon: () => <TabIcon emoji="🔍" /> }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartStackNavigator}
        options={{ title: 'Cart', tabBarIcon: () => <TabIcon emoji="🛒" badge={cartCount} /> }}
      />
    </Tab.Navigator>
  );
}
