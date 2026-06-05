/**
 * Edit profile screen.
 */

import { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/avatar';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';
import { apiPatch } from '@/api/client';

export default function EditProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, setUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!displayName.trim()) {
      Alert.alert('Ошибка', 'Имя не может быть пустым');
      return;
    }
    setSaving(true);
    try {
      const updated = await apiPatch<{ user: any }>('/api/v1/users/me', {
        displayName: displayName.trim(),
        bio: bio.trim() || null,
      });
      if (updated.user) setUser(updated.user);
      router.back();
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Профиль',
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.accent,
          headerRight: () => (
            <Pressable onPress={save} disabled={saving} style={{ marginRight: Spacing.two }}>
              <ThemedText variant="body" color="accent" style={{ fontWeight: '600' }}>
                {saving ? '...' : 'Готово'}
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: theme.bg }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: Spacing.four }}>
            <View style={styles.avatarRow}>
              <Avatar
                username={user?.username || '?'}
                displayName={displayName || user?.displayName}
                size={100}
              />
              <ThemedText variant="subhead" color="secondary" style={{ marginTop: Spacing.three }}>
                {user?.username}
              </ThemedText>
            </View>

            <View style={styles.field}>
              <ThemedText variant="footnote" color="secondary" style={styles.label}>
                ИМЯ
              </ThemedText>
              <View style={[styles.input, { backgroundColor: theme.bgSecondary, borderColor: theme.hairline }]}>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Ваше имя"
                  placeholderTextColor={theme.textPlaceholder}
                  style={[styles.textInput, { color: theme.text }]}
                  maxLength={64}
                />
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText variant="footnote" color="secondary" style={styles.label}>
                О СЕБЕ
              </ThemedText>
              <View style={[styles.input, { backgroundColor: theme.bgSecondary, borderColor: theme.hairline, minHeight: 100, alignItems: 'flex-start' }]}>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Расскажите о себе"
                  placeholderTextColor={theme.textPlaceholder}
                  multiline
                  style={[styles.textInput, { color: theme.text, height: 90, textAlignVertical: 'top' }]}
                  maxLength={256}
                />
              </View>
            </View>
          </ScrollView>
          {saving && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={theme.accent} size="large" />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  avatarRow: { alignItems: 'center', paddingVertical: Spacing.four },
  field: { marginTop: Spacing.four },
  label: { paddingHorizontal: Spacing.two, paddingBottom: Spacing.two, textTransform: 'uppercase' },
  input: {
    borderRadius: Radius.md,
    borderWidth: 0.5,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  textInput: { fontSize: 16, minHeight: 24 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
