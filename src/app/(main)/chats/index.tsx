/**
 * Chats list — главный экран с поиском и списком чатов.
 */

import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';
import { apiGet, apiPost } from '@/api/client';
import type { Chat } from '@/types';

export default function ChatsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ chats: Chat[] }>('/api/v1/chats');
      setChats(data.chats || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = chats.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    if (c.name && c.name.toLowerCase().includes(q)) return true;
    if (c.members?.some((m) => m.username?.toLowerCase().includes(q))) return true;
    if (c.lastMessage?.content?.toLowerCase().includes(q)) return true;
    return false;
  });

  function chatTitle(chat: Chat) {
    if (chat.name) return chat.name;
    const other = chat.members?.[0];
    return other?.displayName || other?.username || 'Чат';
  }

  function chatSubtitle(chat: Chat) {
    const m = chat.lastMessage;
    if (m) {
      const txt = m.content || (m.type === 'image' ? '🖼 Фото' : m.type === 'video' ? '🎥 Видео' : m.type === 'voice' ? '🎤 Голосовое' : m.type === 'file' ? '📎 Файл' : '');
      if (!txt) return 'Нет сообщений';
      return txt.length > 50 ? txt.slice(0, 50) + '…' : txt;
    }
    return chat.type === 'group' ? `${chat.members?.length || 0} участников` : 'Нет сообщений';
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Чаты',
          headerLargeTitle: true,
          headerSearchBarOptions: undefined,
          headerStyle: { backgroundColor: theme.bg },
        }}
      />
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.header}>
          <ThemedText variant="largeTitle">Чаты</ThemedText>
        </View>

        <View style={[styles.searchBar, { backgroundColor: theme.bgSecondary }]}>
          <Icon name="Search" size={18} color={theme.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск"
            placeholderTextColor={theme.textPlaceholder}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.accent} size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Icon name="MessageCircle" size={48} color={theme.textTertiary} />
            <ThemedText variant="headline" color="secondary" style={{ marginTop: Spacing.three }}>
              {query ? 'Ничего не найдено' : 'Нет чатов'}
            </ThemedText>
            <ThemedText variant="subhead" color="tertiary" align="center" style={{ marginTop: Spacing.two, paddingHorizontal: Spacing.six }}>
              {query ? 'Попробуйте изменить запрос' : 'Начните новый чат, нажав на кнопку ниже'}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(); }}
                tintColor={theme.accent}
              />
            }
            renderItem={({ item, index }) => {
              const title = chatTitle(item);
              const subtitle = chatSubtitle(item);
              const isLast = index === filtered.length - 1;
              return (
                <Pressable
                  onPress={() => router.push({ pathname: '/(main)/chats/[id]', params: { id: String(item.id) } })}
                  style={({ pressed }) => [
                    styles.row,
                    { borderBottomColor: theme.separator, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Avatar
                    username={title.toLowerCase()}
                    displayName={title}
                    size={52}
                    isOnline={item.members?.find((m) => m.userId !== m.userId)?.isOnline ?? item.members?.[0]?.isOnline}
                  />
                  <View style={styles.rowContent}>
                    <View style={styles.rowTop}>
                      <ThemedText variant="headline" numberOfLines={1} style={{ flex: 1 }}>
                        {title}
                      </ThemedText>
                      {item.lastMessage ? (
                        <ThemedText variant="caption1" color="secondary">
                          {formatTime(item.lastMessage.createdAt)}
                        </ThemedText>
                      ) : null}
                    </View>
                    <View style={styles.rowBottom}>
                      <ThemedText
                        variant="subhead"
                        color="secondary"
                        numberOfLines={1}
                        style={{ flex: 1 }}
                      >
                        {subtitle}
                      </ThemedText>
                      {item.unreadCount > 0 ? (
                        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                          <ThemedText variant="caption2" color="inverted" style={{ fontWeight: '700' }}>
                            {item.unreadCount > 99 ? '99+' : item.unreadCount}
                          </ThemedText>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        )}

        <Pressable
          onPress={() => router.push('/(modals)/new-chat')}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: theme.accent,
              shadowColor: theme.accent,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}
        >
          <Icon name="Plus" size={28} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </SafeAreaView>
    </>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.six,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    paddingHorizontal: Spacing.three,
    height: 36,
    borderRadius: Radius.md,
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.nine,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
    borderBottomWidth: 0.5,
  },
  rowContent: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.five,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
