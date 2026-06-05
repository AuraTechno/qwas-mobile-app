/**
 * Chats stack — внутри таба "Чаты". Скрывает tab bar при открытии чата.
 */

import { Stack, useNavigation, usePathname } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Platform } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export default function ChatsStackLayout() {
  const theme = useTheme();
  const navigation = useNavigation();
  const pathname = usePathname();

  const isDetail = pathname !== '/chats' && pathname !== '/(main)/chats' && pathname.endsWith('/chats');

  useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;

    if (isDetail) {
      parent.setOptions({
        tabBarStyle: { display: 'none' },
      });
    } else {
      parent.setOptions({
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          borderTopWidth: 0.5,
          borderTopColor: theme.hairline,
          backgroundColor: 'transparent',
          elevation: 0,
        },
      });
    }
  }, [isDetail, theme.hairline, navigation]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'default',
        animationDuration: 250,
        contentStyle: { backgroundColor: theme.bg },
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'none' }} />
    </Stack>
  );
}
