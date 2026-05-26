import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/lib/i18n/locale';
import { useOfflineState } from '@/hooks/useOfflineState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  60_000,       // 1 min before background refetch
      gcTime:     5 * 60_000,   // 5 min cache — provides offline reads
      retry:      1,
    },
  },
});

function AuthGuard(): null {
  const token    = useAuthStore((s) => s.token);
  const isReady  = useAuthStore((s) => s.isReady);
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    if (!isReady) return;

    const inAuth = segments[0] === '(auth)';

    if (!token && !inAuth) {
      router.replace('/(auth)/login');
    } else if (token && inAuth) {
      router.replace('/(tabs)');
    }
  }, [token, isReady, segments, router]);

  return null;
}

export default function RootLayout(): React.ReactElement {
  const setReady = useAuthStore((s) => s.setReady);
  // Subscribe so the whole tree re-renders when the user toggles language;
  // the `sl` proxy then resolves into the new locale on every access.
  useLocaleStore((s) => s.locale);
  const { online } = useOfflineState();

  // Mark hydration complete after first render (zustand/persist rehydrates synchronously
  // from AsyncStorage via the onRehydrateStorage callback — handled here for simplicity).
  useEffect(() => {
    setReady();
  }, [setReady]);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGuard />
          <View style={{ flex: 1 }}>
            <OfflineBanner visible={!online} />
            <View style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)"  options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)"  options={{ headerShown: false }} />
              </Stack>
            </View>
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
