/**
 * Active sessions — список устройств с активным логином.
 */

import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, RefreshControl, Alert, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';
import { apiGet, apiDelete, apiPost } from '@/api/client';
import { useAuth } from '@/store/auth';
import * as Application from 'expo-application';

interface Session {
  id: string;
  deviceName: string;
  os: string;
  appVersion: string;
  ipAddress: string;
  isCurrent: boolean;
  lastActive: string;
  createdAt: string;
}

export default function SessionsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const me = useAuth((s) => s.user);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ sessions: Session[] }>('/api/v1/auth/sessions');
      setSessions(data.sessions || []);
    } catch (e) {
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function terminate(id: string) {
    Alert.alert('Завершить сессию?', 'Это устройство будет отключено', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Завершить',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(`/api/v1/auth/sessions/${id}`);
            setSessions((prev) => prev.filter((s) => s.id !== id));
          } catch (e) {
            Alert.alert('Ошибка');
          }
        },
      },
    ]);
  }

  async function terminateAll() {
    Alert.alert('Завершить все другие сессии?', 'Все остальные устройства будут отключены', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Завершить все',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiPost('/api/v1/auth/terminate-all', {});
            setSessions((prev) => prev.filter((s) => s.isCurrent));
          } catch (e) {
            Alert.alert('Ошибка');
          }
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Активные сессии',
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.accent,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        {sessions.length > 1 && (
          <View style={styles.header}>
            <Pressable
              onPress={terminateAll}
              style={({ pressed }) => [styles.terminateAllBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Icon name="LogOut" size={16} color="#ff3b30" />
              <ThemedText variant="subhead" color="error" style={{ marginLeft: 6, color: '#ff3b30' }}>
                Завершить все другие
              </ThemedText>
            </Pressable>
          </View>
        )}
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />
          }
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.center}>
                <Icon name="Smartphone" size={48} color={theme.textTertiary} />
                <ThemedText variant="subhead" color="secondary" style={{ marginTop: Spacing.three }}>
                  Нет активных сессий
                </ThemedText>
              </View>
            )
          }
          renderItem={({ item }) => (
            <View style={[styles.row, { borderBottomColor: theme.separator }]}>
              <View style={[styles.deviceIcon, { backgroundColor: item.isCurrent ? theme.accentMuted : theme.bgSecondary }]}>
                <Icon
                  name={item.os?.toLowerCase().includes('ios') || item.os?.toLowerCase().includes('mac') ? 'Smartphone' : 'MonitorSmartphone'}
                  size={22}
                  color={item.isCurrent ? theme.accent : theme.textSecondary}
                />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.three }}>
                <ThemedText variant="headline">
                  {item.deviceName} {item.isCurrent && '(это устройство)'}
                </ThemedText>
                <ThemedText variant="caption1" color="secondary">
                  {item.os} · {item.appVersion}
                </ThemedText>
                <ThemedText variant="caption2" color="tertiary" style={{ marginTop: 2 }}>
                  Активно: {new Date(item.lastActive).toLocaleString()}
                </ThemedText>
              </View>
              {!item.isCurrent && (
                <Pressable onPress={() => terminate(item.id)} style={styles.terminateBtn}>
                  <Icon name="X" size={18} color="#ff3b30" />
                </Pressable>
              )}
            </View>
          )}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.six },
  header: { padding: Spacing.four },
  terminateAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: Radius.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three, borderBottomWidth: 0.5 },
  deviceIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  terminateBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
