/**
 * Forward message modal — выбор чата для пересылки.
 */

import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';
import { apiGet, apiPost } from '@/api/client';
import type { Chat, Message } from '@/types';

export default function ForwardScreen() {
  const { id, type, content, mediaUrl, mediaMeta } = useLocalSearchParams<{
    id: string; type: string; content: string; mediaUrl: string; mediaMeta: string;
  }>();
  const router = useRouter();
  const theme = useTheme();

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ chats: Chat[] }>('/api/v1/chats');
      setChats(data.chats || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function forwardTo(chatId: number) {
    if (sending) return;
    setSending(true);
    try {
      const srcId = Number(id);
      await apiPost(`/api/v1/chats/${chatId}/messages`, {
        type: type || 'text',
        content: content || '',
        mediaUrl: mediaUrl || null,
        mediaMeta: mediaMeta || null,
        forwardedFromId: srcId,
      });
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Переслать',
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.accent,
        }}
      />
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[styles.preview, { backgroundColor: theme.bgSecondary }]}>
          <ThemedText variant="caption1" color="secondary">Сообщение:</ThemedText>
          <ThemedText variant="body" numberOfLines={3} style={{ marginTop: 4 }}>
            {type === 'text' ? content : type === 'image' ? '🖼 Фото' : type === 'video' ? '🎥 Видео' : type === 'voice' ? '🎤 Голосовое' : type === 'location' ? '📍 Местоположение' : type === 'contact' ? '👤 Контакт' : '📎 Файл'}
          </ThemedText>
        </View>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(c) => String(c.id)}
            renderItem={({ item }) => {
              const title = item.name || item.members?.[0]?.displayName || 'Чат';
              return (
                <Pressable
                  onPress={() => forwardTo(item.id)}
                  disabled={sending}
                  style={({ pressed }) => [styles.row, { borderBottomColor: theme.separator, opacity: pressed ? 0.6 : 1 }]}
                >
                  <Avatar username={title.toLowerCase()} displayName={title} size={44} />
                  <View style={{ flex: 1, marginLeft: Spacing.three }}>
                    <ThemedText variant="headline">{title}</ThemedText>
                    <ThemedText variant="caption1" color="secondary">{item.type === 'private' ? 'Личный' : item.type === 'channel' ? 'Канал' : `${item.members?.length || 0} участников`}</ThemedText>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  preview: { padding: Spacing.three, margin: Spacing.four, borderRadius: Radius.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three, borderBottomWidth: 0.5 },
});
