/**
 * Modals group layout.
 */

import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: true,
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="new-chat" options={{ title: 'Новый чат' }} />
      <Stack.Screen name="chat-info" options={{ title: 'Информация' }} />
      <Stack.Screen name="wallpapers" options={{ title: 'Обои чата' }} />
    </Stack>
  );
}
