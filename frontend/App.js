import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import store from './src/redux/store';
import RootNavigator from './src/navigation/RootNavigator';
import { loadUser } from './src/redux/slices/user/authSlice';
import { loadCart } from './src/redux/slices/user/cartSlice';
import { registerForPushNotifications, setupNotificationListeners } from './src/services/notificationService';
import { toastConfig } from './src/components/ui/ToastConfig';
import { COLORS } from './src/constants/theme';

function AppInner() {
  const dispatch = useDispatch();
  const navigationRef = useRef(null);
  const { isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(loadUser());
    dispatch(loadCart());
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotifications();
    }
    const cleanup = setupNotificationListeners(navigationRef);
    return cleanup;
  }, [isAuthenticated]);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <RootNavigator />
      <Toast config={toastConfig} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Provider store={store}>
          <AppInner />
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
