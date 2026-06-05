/**
 * New call modal — pick chat + audio/video.
 */

import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';
import { apiGet, apiPost } from '@/api/client';
import type { Chat } from '@/types';

export default function NewCallScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState<number | null>(null);
  const [type, setType] = useState<'audio' | 'video'>('audio');

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ chats: Chat[] }>('/api/v1/chats');
      setChats((data.chats || []).filter((c) => c.type === 'private'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function call(chat: Chat) {
    if (calling) return;
    setCalling(chat.id);
    try {
      const data = await apiPost<{ call: { id: string } }>(`/api/v1/chats/${chat.id}/calls`, { type });
      if (data.call?.id) {
        router.dismiss();
        router.push({ pathname: '/(modals)/call', params: { callId: data.call.id, chatId: String(chat.id), type, outgoing: '1' } });
      }
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message || 'Не удалось начать звонок');
    } finally {
      setCalling(null);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'modal',
          title: 'Новый звонок',
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.accent,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.typeRow}>
          <Pressable
            onPress={() => setType('audio')}
            style={[
              styles.typeBtn,
              { backgroundColor: type === 'audio' ? theme.accent : theme.bgSecondary },
            ]}
          >
            <Icon name="Phone" size={18} color={type === 'audio' ? '#fff' : theme.text} />
            <ThemedText variant="subhead" style={{ color: type === 'audio' ? '#fff' : theme.text, marginLeft: 6, fontWeight: '600' }}>
              Аудио
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setType('video')}
            style={[
              styles.typeBtn,
              { backgroundColor: type === 'video' ? theme.accent : theme.bgSecondary },
            ]}
          >
            <Icon name="Video" size={18} color={type === 'video' ? '#fff' : theme.text} />
            <ThemedText variant="subhead" style={{ color: type === 'video' ? '#fff' : theme.text, marginLeft: 6, fontWeight: '600' }}>
              Видео
            </ThemedText>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : chats.length === 0 ? (
          <View style={styles.center}>
            <ThemedText variant="subhead" color="secondary">Нет личных чатов</ThemedText>
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(c) => String(c.id)}
            renderItem={({ item }) => {
              const title = item.name || item.members?.[0]?.displayName || 'Чат';
              return (
                <Pressable
                  onPress={() => call(item)}
                  disabled={!!calling}
                  style={({ pressed }) => [styles.row, { borderBottomColor: theme.separator, opacity: pressed || calling ? 0.6 : 1 }]}
                >
                  <Avatar username={title.toLowerCase()} displayName={title} size={44} isOnline={item.members?.[0]?.isOnline} />
                  <View style={{ flex: 1, marginLeft: Spacing.three }}>
                    <ThemedText variant="headline">{title}</ThemedText>
                    <ThemedText variant="caption1" color="secondary">
                      {item.members?.[0]?.isOnline ? 'в сети' : 'Личный чат'}
                    </ThemedText>
                  </View>
                  {calling === item.id ? (
                    <ActivityIndicator color={theme.accent} />
                  ) : (
                    <View style={[styles.callIcon, { backgroundColor: '#34c759' }]}>
                      <Icon name={type === 'video' ? 'Video' : 'Phone'} size={18} color="#fff" />
                    </View>
                  )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.six },
  typeRow: { flexDirection: 'row', padding: Spacing.four, gap: Spacing.two },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.three, borderRadius: Radius.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three, borderBottomWidth: 0.5 },
  callIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
