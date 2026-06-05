/**
 * Contacts screen.
 */

import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { apiGet, apiPost } from '@/api/client';
import type { User, Chat } from '@/types';

export default function ContactsScreen() {
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
        const data = await apiGet<User[]>(`/api/v1/users/search?q=${encodeURIComponent(query.trim())}`);
        setUsers(data);
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
      const chat = await apiPost<Chat>('/api/v1/chats', {
        type: 'private',
        username: user.username,
      });
      router.push({ pathname: '/(main)/chats/[id]', params: { id: String(chat.id) } });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <ThemedText variant="largeTitle">Контакты</ThemedText>
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.bgSecondary }]}>
        <Icon name="Search" size={18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Поиск по username"
          placeholderTextColor={theme.textPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : query.trim().length < 2 ? (
        <View style={styles.center}>
          <Icon name="Search" size={48} color={theme.textTertiary} />
          <ThemedText variant="subhead" color="secondary" style={{ marginTop: Spacing.three }}>
            Введите минимум 2 символа
          </ThemedText>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.center}>
          <Icon name="UserX" size={48} color={theme.textTertiary} />
          <ThemedText variant="subhead" color="secondary" style={{ marginTop: Spacing.three }}>
            Никого не найдено
          </ThemedText>
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
              {item.isOnline ? (
                <View style={[styles.onlineDot, { backgroundColor: theme.online }]} />
              ) : null}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.six, paddingTop: Spacing.two, paddingBottom: Spacing.three },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    paddingHorizontal: Spacing.three,
    height: 36,
    borderRadius: 10,
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.nine },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
    borderBottomWidth: 0.5,
  },
  onlineDot: { width: 12, height: 12, borderRadius: 6 },
});
