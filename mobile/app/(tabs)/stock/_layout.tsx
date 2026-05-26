import { Stack } from 'expo-router';
import React from 'react';
import { sl } from '@/constants/i18n';

export default function StockLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add"   options={{ presentation: 'modal', title: sl.stock.addStock }} />
    </Stack>
  );
}
