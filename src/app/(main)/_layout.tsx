/**
 * Main app group layout (chats + tabs).
 */

import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';

import { Icon } from '@/components/icon';
import { useTheme, useColorSchemeName } from '@/hooks/use-theme';

export default function MainLayout() {
  const theme = useTheme();
  const scheme = useColorSchemeName();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
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
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              tint={scheme === 'dark' ? 'dark' : 'light'}
              intensity={80}
              style={{ flex: 1 }}
            />
          ) : (
            <View style={{ flex: 1, backgroundColor: theme.tabBarBg }} />
          ),
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Чаты',
          tabBarIcon: ({ color, size }) => (
            <Icon name="MessageCircle" color={String(color)} size={(size ?? 22) - 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Контакты',
          tabBarIcon: ({ color, size }) => (
            <Icon name="Users" color={String(color)} size={(size ?? 22) - 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Звонки',
          tabBarIcon: ({ color, size }) => (
            <Icon name="Phone" color={String(color)} size={(size ?? 22) - 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Настройки',
          tabBarIcon: ({ color, size }) => (
            <Icon name="Settings" color={String(color)} size={(size ?? 22) - 2} />
          ),
        }}
      />
    </Tabs>
  );
}
