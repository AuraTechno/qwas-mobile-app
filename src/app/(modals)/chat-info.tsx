/**
 * Chat info screen — members, settings, actions.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/api/client';
import type { Chat, User } from '@/types';
import { useAuth } from '@/store/auth';

export default function ChatInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = Number(id);
  const router = useRouter();
  const theme = useTheme();
  const me = useAuth((s) => s.user);

  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ chat: Chat }>(`/api/v1/chats/${chatId}`);
      setChat(data.chat);
      setMuted(!!data.chat.isMuted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => { load(); }, [load]);

  const chatTitle = chat?.name || chat?.members?.find((m) => m.userId !== me?.id)?.displayName || 'Чат';
  const chatSubtitle = chat?.type === 'private' ? 'Личный чат'
    : chat?.type === 'channel' ? 'Канал'
    : `Группа · ${chat?.members?.length || 0} участников`;

  async function toggleMute(hours: number) {
    try {
      const res = await apiPost<{ ok: boolean; isMuted: boolean }>(`/api/v1/chats/${chatId}/mute`, { durationHours: hours });
      setMuted(!!res.isMuted);
    } catch (e) {
      console.error(e);
    }
  }

  function pickMuteDuration() {
    Alert.alert('Уведомления', undefined, [
      { text: muted ? 'Включить' : '8 часов', onPress: () => toggleMute(muted ? 0 : 8) },
      { text: 'На 1 день', onPress: () => toggleMute(24) },
      { text: 'На 3 дня', onPress: () => toggleMute(72) },
      { text: 'Навсегда', onPress: () => toggleMute(24 * 365 * 100) },
      { text: 'Отмена', style: 'cancel' },
    ]);
  }

  async function clearHistory() {
    Alert.alert('Очистить историю?', 'Все сообщения будут удалены (у участников тоже)', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Очистить',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(`/api/v1/chats/${chatId}/messages`);
            router.back();
          } catch (e) {
            console.error(e);
            Alert.alert('Ошибка', 'Не удалось очистить');
          }
        },
      },
    ]);
  }

  async function leaveChat() {
    Alert.alert('Покинуть чат?', 'Вы больше не будете участником', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Покинуть',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiPost(`/api/v1/chats/${chatId}/leave`, {});
            router.back();
          } catch (e) {
            console.error(e);
            Alert.alert('Ошибка', 'Не удалось покинуть');
          }
        },
      },
    ]);
  }

  if (loading || !chat) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Информация',
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.accent,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <FlatList
          data={chat.members || []}
          keyExtractor={(item) => String(item.userId)}
          ListHeaderComponent={
            <View>
              <View style={styles.header}>
                <Avatar
                  username={(chatTitle).toLowerCase()}
                  displayName={chatTitle}
                  size={96}
                  isOnline={chat.members?.[0]?.isOnline}
                />
                <ThemedText variant="title1" align="center" style={{ marginTop: Spacing.three }}>
                  {chatTitle}
                </ThemedText>
                <ThemedText variant="subhead" color="secondary" align="center" style={{ marginTop: 4 }}>
                  {chatSubtitle}
                </ThemedText>
              </View>

              {chat.type === 'private' && (
                <View style={styles.actionGrid}>
                  <ActionButton icon="Phone" label="Позвонить" onPress={() => Alert.alert('Скоро', 'Звонки в разработке')} />
                  <ActionButton icon="Video" label="Видео" onPress={() => Alert.alert('Скоро', 'Видеозвонки в разработке')} />
                  <ActionButton icon="Search" label="Поиск" onPress={() => Alert.alert('Скоро', 'Поиск в разработке')} />
                  <ActionButton icon="BellOff" label="Без звука" onPress={pickMuteDuration} muted={muted} />
                </View>
              )}

              <View style={[styles.section, { backgroundColor: theme.bgSecondary }]}>
                <SettingRow icon={muted ? 'BellOff' : 'Bell'} label="Уведомления" right={
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ThemedText variant="subhead" color="tertiary" style={{ marginRight: 8 }}>
                      {muted ? 'Без звука' : 'Включены'}
                    </ThemedText>
                    <Icon name="ChevronRight" size={18} color={theme.textTertiary} />
                  </View>
                } onPress={pickMuteDuration} />
                <SettingRow icon="Search" label="Поиск в чате" onPress={() => Alert.alert('Скоро')} />
                {chat.type !== 'private' && (
                  <SettingRow icon="UserPlus" label="Добавить участника" onPress={() => Alert.alert('Скоро')} />
                )}
              </View>

              <View style={[styles.section, { backgroundColor: theme.bgSecondary }]}>
                <SettingRow
                  icon="Trash2"
                  label="Очистить историю"
                  destructive
                  onPress={clearHistory}
                />
                {chat.type !== 'private' && chat.type !== 'self' && (
                  <SettingRow
                    icon="LogOut"
                    label={chat.type === 'channel' ? 'Отписаться' : 'Покинуть чат'}
                    destructive
                    onPress={leaveChat}
                  />
                )}
              </View>

              <ThemedText variant="footnote" color="tertiary" align="center" style={{ marginVertical: Spacing.four }}>
                {chat.members?.length || 0} {chat.members?.length === 1 ? 'участник' : 'участников'}
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/(main)/contacts', params: { username: item.username } })}
              style={({ pressed }) => [styles.memberRow, { borderBottomColor: theme.separator, opacity: pressed ? 0.6 : 1 }]}
            >
              <Avatar
                username={item.username}
                displayName={item.displayName}
                size={44}
                isOnline={item.isOnline}
              />
              <View style={{ flex: 1, marginLeft: Spacing.three }}>
                <ThemedText variant="body">
                  {item.displayName} {item.userId === me?.id ? '(вы)' : ''}
                </ThemedText>
                <ThemedText variant="caption1" color="secondary">
                  @{item.username}
                  {item.role !== 'member' ? ` · ${item.role === 'owner' ? 'владелец' : 'админ'}` : ''}
                </ThemedText>
              </View>
              {item.isOnline && <ThemedText variant="caption1" color="success">в сети</ThemedText>}
            </Pressable>
          )}
        />
      </SafeAreaView>
    </>
  );
}

function ActionButton({ icon, label, onPress, muted }: { icon: any; label: string; onPress: () => void; muted?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.5 : 1 }]}
    >
      <View style={[styles.actionIcon, { backgroundColor: theme.bgSecondary }]}>
        <Icon name={icon} size={22} color={muted ? theme.textTertiary : theme.accent} />
      </View>
      <ThemedText variant="caption1" color={muted ? 'tertiary' : 'accent'} style={{ marginTop: 6 }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function SettingRow({
  icon, label, onPress, right, destructive,
}: {
  icon: any; label: string; onPress?: () => void; right?: React.ReactNode; destructive?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.settingRow, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Icon name={icon} size={20} color={destructive ? '#ff3b30' : theme.accent} />
      <ThemedText variant="body" style={{ color: destructive ? '#ff3b30' : theme.text, marginLeft: Spacing.three, flex: 1 }}>
        {label}
      </ThemedText>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 0.5,
  },
});
