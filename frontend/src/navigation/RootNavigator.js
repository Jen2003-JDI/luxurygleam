import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { ActivityIndicator, View } from 'react-native';

import AuthNavigator from './AuthNavigator';
import DrawerNavigator from './DrawerNavigator';
import { COLORS } from '../constants/theme';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, loading } = useSelector((s) => s.auth);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Stack.Screen name="Main" component={DrawerNavigator} />
      )}
    </Stack.Navigator>
  );
}
