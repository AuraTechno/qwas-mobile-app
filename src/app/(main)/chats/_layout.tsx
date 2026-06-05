/**
 * Chats stack — внутри таба "Чаты". Скрывает tab bar при открытии чата.
 * Реальное скрытие делается в самом [id].tsx через getParent().
 */

import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export default function ChatsStackLayout() {
  const theme = useTheme();
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
