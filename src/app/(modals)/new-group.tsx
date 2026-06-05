/**
 * New group / channel creation.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  View, TextInput, FlatList, StyleSheet, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';
import { apiGet, apiPost } from '@/api/client';
import type { User, Chat } from '@/types';

type Mode = 'group' | 'channel';

export default function NewGroupChannel() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<Mode>(params.mode === 'channel' ? 'channel' : 'group');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<Map<number, User>>(new Map());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await apiGet<{ users: User[] }>(`/api/v1/users/search?q=${encodeURIComponent(query.trim())}`);
        setSearchResults((data.users || []).filter((u) => !selected.has(u.id)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, selected]);

  function toggle(user: User) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(user.id)) next.delete(user.id);
      else next.set(user.id, user);
      return next;
    });
  }

  async function create() {
    if (creating) return;
    if (mode === 'group' && !name.trim()) {
      Alert.alert('Введите название');
      return;
    }
    if (mode === 'group' && selected.size === 0) {
      Alert.alert('Выберите участников', 'Добавьте хотя бы одного участника');
      return;
    }
    if (mode === 'channel' && !name.trim()) {
      Alert.alert('Введите название канала');
      return;
    }
    setCreating(true);
    try {
      const body: any = {
        type: mode,
        name: name.trim() || null,
        description: description.trim() || null,
        userIds: Array.from(selected.keys()),
      };
      const data = await apiPost<{ chat: Chat }>('/api/v1/chats', body);
      router.dismiss();
      if (data.chat?.id) {
        router.push({ pathname: '/(main)/chats/[id]', params: { id: String(data.chat.id) } });
      }
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message || 'Не удалось создать');
    } finally {
      setCreating(false);
    }
  }

  const selectedList = Array.from(selected.values());

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'modal',
          title: mode === 'group' ? 'Новая группа' : 'Новый канал',
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.accent,
          headerRight: () => (
            <Pressable onPress={create} disabled={creating} style={{ marginRight: Spacing.two }}>
              {creating ? (
                <ActivityIndicator color={theme.accent} />
              ) : (
                <ThemedText variant="body" color="accent" style={{ fontWeight: '600' }}>
                  Создать
                </ThemedText>
              )}
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setMode('group')}
              style={[
                styles.modeBtn,
                { backgroundColor: mode === 'group' ? theme.accent : theme.bgSecondary },
              ]}
            >
              <Icon name="Users" size={18} color={mode === 'group' ? '#fff' : theme.text} />
              <ThemedText variant="subhead" style={{ color: mode === 'group' ? '#fff' : theme.text, marginLeft: 8, fontWeight: '600' }}>
                Группа
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setMode('channel')}
              style={[
                styles.modeBtn,
                { backgroundColor: mode === 'channel' ? theme.accent : theme.bgSecondary },
              ]}
            >
              <Icon name="Megaphone" size={18} color={mode === 'channel' ? '#fff' : theme.text} />
              <ThemedText variant="subhead" style={{ color: mode === 'channel' ? '#fff' : theme.text, marginLeft: 8, fontWeight: '600' }}>
                Канал
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <ThemedText variant="footnote" color="secondary" style={styles.label}>
                {mode === 'group' ? 'НАЗВАНИЕ ГРУППЫ' : 'НАЗВАНИЕ КАНАЛА'}
              </ThemedText>
              <View style={[styles.input, { backgroundColor: theme.bgSecondary, borderColor: theme.hairline }]}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={mode === 'group' ? 'Например, Команда QWAS' : 'Например, Новости'}
                  placeholderTextColor={theme.textPlaceholder}
                  style={[styles.textInput, { color: theme.text }]}
                  maxLength={128}
                />
              </View>
            </View>

            {mode === 'channel' && (
              <View style={styles.field}>
                <ThemedText variant="footnote" color="secondary" style={styles.label}>
                  ОПИСАНИЕ (необязательно)
                </ThemedText>
                <View style={[styles.input, { backgroundColor: theme.bgSecondary, borderColor: theme.hairline }]}>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="О чём этот канал"
                    placeholderTextColor={theme.textPlaceholder}
                    style={[styles.textInput, { color: theme.text }]}
                    maxLength={256}
                    multiline
                  />
                </View>
              </View>
            )}

            {mode === 'group' && (
              <>
                {selectedList.length > 0 && (
                  <View style={styles.field}>
                    <ThemedText variant="footnote" color="secondary" style={styles.label}>
                      ВЫБРАНО ({selectedList.length})
                    </ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, gap: Spacing.two }}>
                      {selectedList.map((u) => (
                        <Pressable
                          key={u.id}
                          onPress={() => toggle(u)}
                          style={[styles.selectedChip, { backgroundColor: theme.accent }]}
                        >
                          <Avatar username={u.username} displayName={u.displayName} size={24} />
                          <ThemedText variant="footnote" color="inverted" style={{ color: '#fff', marginLeft: 6 }}>
                            {u.displayName} ×
                          </ThemedText>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.field}>
                  <ThemedText variant="footnote" color="secondary" style={styles.label}>
                    ДОБАВИТЬ УЧАСТНИКОВ
                  </ThemedText>
                  <View style={[styles.searchBar, { backgroundColor: theme.bgSecondary }]}>
                    <Icon name="Search" size={16} color={theme.textSecondary} />
                    <TextInput
                      value={query}
                      onChangeText={setQuery}
                      placeholder="Поиск..."
                      placeholderTextColor={theme.textPlaceholder}
                      autoCapitalize="none"
                      style={[styles.searchInput, { color: theme.text, fontSize: 15 }]}
                    />
                  </View>
                </View>

                {loading ? (
                  <ActivityIndicator color={theme.accent} style={{ marginTop: Spacing.four }} />
                ) : (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(u) => String(u.id)}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => toggle(item)}
                        style={({ pressed }) => [styles.row, { borderBottomColor: theme.separator, opacity: pressed ? 0.6 : 1 }]}
                      >
                        <Avatar username={item.username} displayName={item.displayName} size={40} />
                        <View style={{ flex: 1, marginLeft: Spacing.three }}>
                          <ThemedText variant="body">{item.displayName}</ThemedText>
                          <ThemedText variant="caption1" color="secondary">@{item.username}</ThemedText>
                        </View>
                        <Icon name="Plus" size={20} color={theme.accent} />
                      </Pressable>
                    )}
                  />
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  modeRow: { flexDirection: 'row', padding: Spacing.four, gap: Spacing.two },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.three, borderRadius: Radius.md,
  },
  field: { marginBottom: Spacing.three },
  label: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.two, textTransform: 'uppercase' },
  input: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  textInput: { fontSize: 16, minHeight: 24 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    paddingHorizontal: Spacing.three,
    height: 36,
    borderRadius: Radius.md,
    gap: Spacing.two,
  },
  searchInput: { flex: 1, paddingVertical: 0 },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 0.5,
  },
});
