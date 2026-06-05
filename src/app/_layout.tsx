/**
 * Root layout — providers: auth, theme, network.
 */

import { useEffect } from 'react';
import { ActivityIndicator, View, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { useAuth } from '@/store/auth';
import { useTheme, useColorSchemeName } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'idle' || status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (status === 'authenticated' && inAuthGroup) {
      router.replace('/(main)/chats');
    }
  }, [status, segments, router]);

  if (status === 'idle' || status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator color="#5e8ee7" size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const theme = useTheme();
  const scheme = useColorSchemeName();
  const bootstrap = useAuth((s) => s.bootstrap);

  useEffect(() => {
    bootstrap().finally(() => {
      SplashScreen.hideAsync().catch(() => {});
    });
  }, [bootstrap]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ExpoStatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.bg },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(main)" />
            <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
          </Stack>
        </AuthGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
