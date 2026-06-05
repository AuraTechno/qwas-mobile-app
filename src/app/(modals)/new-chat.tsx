/**
 * New chat modal.
 */

import { useEffect, useState, useCallback } from 'react';
import { View, TextInput, FlatList, StyleSheet, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';
import { apiGet, apiPost } from '@/api/client';
import type { User } from '@/types';

export default function NewChatModal() {
  const router = useRouter();
  const theme = useTheme();

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setUsers([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await apiGet<{ users: User[] }>(`/api/v1/users/search?q=${encodeURIComponent(query.trim())}`);
        setUsers(data.users || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function startChat(user: User) {
    try {
      const data = await apiPost<{ chat: { id: number } }>('/api/v1/chats', {
        type: 'private',
        username: user.username,
      });
      router.dismiss();
      if (data.chat?.id) {
        router.push({ pathname: '/(main)/chats/[id]', params: { id: String(data.chat.id) } });
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'modal',
          title: 'Новый чат',
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.accent,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={[styles.searchBar, { backgroundColor: theme.bgSecondary }]}>
            <Icon name="Search" size={18} color={theme.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Найти пользователя"
              placeholderTextColor={theme.textPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : query.trim().length < 2 ? (
            <ScrollView contentContainerStyle={styles.center}>
              <Pressable
                onPress={() => router.replace({ pathname: '/(modals)/new-group', params: { mode: 'group' } })}
                style={({ pressed }) => [styles.quickAction, { backgroundColor: theme.bgSecondary, opacity: pressed ? 0.6 : 1 }]}
              >
                <Icon name="Users" size={22} color={theme.accent} />
                <ThemedText variant="headline" color="accent" style={{ marginLeft: Spacing.three }}>
                  Создать группу
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => router.replace({ pathname: '/(modals)/new-group', params: { mode: 'channel' } })}
                style={({ pressed }) => [styles.quickAction, { backgroundColor: theme.bgSecondary, opacity: pressed ? 0.6 : 1 }]}
              >
                <Icon name="Megaphone" size={22} color={theme.accent} />
                <ThemedText variant="headline" color="accent" style={{ marginLeft: Spacing.three }}>
                  Создать канал
                </ThemedText>
              </Pressable>
              <Icon name="UserPlus" size={48} color={theme.textTertiary} style={{ marginTop: Spacing.six }} />
              <ThemedText variant="subhead" color="secondary" style={{ marginTop: Spacing.three, textAlign: 'center' }}>
                Введите минимум 2 символа{'\n'}чтобы найти пользователя
              </ThemedText>
            </ScrollView>
          ) : users.length === 0 ? (
            <View style={styles.center}>
              <ThemedText variant="subhead" color="secondary">Никого не найдено</ThemedText>
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(u) => String(u.id)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => startChat(item)}
                  style={({ pressed }) => [styles.row, { borderBottomColor: theme.separator, opacity: pressed ? 0.6 : 1 }]}
                >
                  <Avatar username={item.username} displayName={item.displayName} size={48} />
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="headline">{item.displayName}</ThemedText>
                    <ThemedText variant="subhead" color="secondary">@{item.username}</ThemedText>
                  </View>
                </Pressable>
              )}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.four,
    paddingHorizontal: Spacing.three,
    height: 36,
    borderRadius: Radius.md,
    gap: Spacing.two,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.six },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    borderBottomWidth: 0.5,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    width: '90%',
    marginBottom: Spacing.two,
  },
});
