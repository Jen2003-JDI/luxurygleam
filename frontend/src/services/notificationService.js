import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C9A84C',
    });
  }

  // Save token to backend
  try {
    await api.post('/auth/push-token', { token });
  } catch (e) {
    console.log('Could not save push token:', e.message);
  }

  return token;
};

export const removePushToken = async (token) => {
  try {
    await api.delete('/auth/push-token', { data: { token } });
  } catch (e) {
    console.log('Could not remove push token:', e.message);
  }
};

export const setupNotificationListeners = (navigationRef) => {
  // Foreground notification listener
  const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received in foreground:', notification);
  });

  // Handle notification tap
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.screen && navigationRef?.current) {
      if (data.screen === 'OrderDetail' && data.orderId) {
        navigationRef.current.navigate('HomeTabs', {
          screen: 'HomeTab',
          params: { screen: 'OrderDetail', params: { orderId: data.orderId } },
        });
      } else if (data.screen === 'Home') {
        navigationRef.current.navigate('HomeTabs', { screen: 'HomeTab', params: { screen: 'Home' } });
      }
    }
  });

  return () => {
    foregroundSub.remove();
    responseSub.remove();
  };
};
