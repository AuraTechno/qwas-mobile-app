/**
 * Calls screen — история звонков + инициация.
 */

import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { apiGet } from '@/api/client';
import { useAuth } from '@/store/auth';
import type { Call, Chat, User } from '@/types';

export default function CallsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const me = useAuth((s) => s.user);

  const [calls, setCalls] = useState<(Call & { other?: User; chat?: Chat })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ calls: Call[] }>('/api/v1/calls');
      setCalls(data.calls || []);
    } catch {
      setCalls([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startCall(_type: 'audio' | 'video') {
    router.push('/(modals)/new-call');
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <ThemedText variant="largeTitle">Звонки</ThemedText>
      </View>

      <View style={styles.quickActions}>
        <Pressable
          onPress={() => startCall('audio')}
          style={({ pressed }) => [styles.quickAction, { backgroundColor: theme.bgSecondary, opacity: pressed ? 0.6 : 1 }]}
        >
          <View style={[styles.quickIcon, { backgroundColor: '#34c759' }]}>
            <Icon name="Phone" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.three }}>
            <ThemedText variant="headline">Новый звонок</ThemedText>
            <ThemedText variant="caption1" color="secondary">Аудио или видео</ThemedText>
          </View>
          <Icon name="ChevronRight" size={18} color={theme.textTertiary} />
        </Pressable>
      </View>

      <ThemedText variant="footnote" color="secondary" style={styles.sectionTitle}>
        НЕДАВНИЕ
      </ThemedText>

      {calls.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="Phone" size={48} color={theme.textTertiary} />
          <ThemedText variant="headline" color="secondary" style={{ marginTop: Spacing.three }}>
            История звонков
          </ThemedText>
          <ThemedText variant="subhead" color="tertiary" align="center" style={{ marginTop: Spacing.two, paddingHorizontal: Spacing.six }}>
            Звонки появятся здесь после первого вызова
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={calls}
          keyExtractor={(c) => String(c.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, { borderBottomColor: theme.separator, opacity: pressed ? 0.6 : 1 }]}
            >
              <Avatar username={item.chat?.name || `c${item.chatId}`} size={44} />
              <View style={{ flex: 1, marginLeft: Spacing.three }}>
                <ThemedText variant="headline">{item.chat?.name || `Чат #${item.chatId}`}</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Icon
                    name={item.status === 'missed' ? 'PhoneMissed' : item.status === 'rejected' ? 'PhoneOff' : item.initiatorId === me?.id ? 'PhoneOutgoing' : 'PhoneIncoming'}
                    size={12}
                    color={item.status === 'missed' ? '#ff3b30' : theme.accent}
                  />
                  <ThemedText variant="caption1" color="secondary" style={{ marginLeft: 4 }}>
                    {new Date(item.startedAt).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </ThemedText>
                </View>
              </View>
              <Pressable
                onPress={() => startCall(item.type)}
                style={styles.callIcon}
              >
                <Icon name={item.type === 'video' ? 'Video' : 'Phone'} size={18} color={theme.accent} />
              </Pressable>
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
  quickActions: { paddingHorizontal: Spacing.four },
  quickAction: { flexDirection: 'row', alignItems: 'center', padding: Spacing.three, borderRadius: 12, marginBottom: Spacing.three },
  quickIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.two, textTransform: 'uppercase' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.nine },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three, borderBottomWidth: 0.5 },
  callIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
