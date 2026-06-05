/**
 * Login screen.
 */

import { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const login = useAuth((s) => s.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = username.trim().length >= 3 && password.length >= 8;

  async function handleSubmit() {
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await login(username.trim(), password);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e?.message || 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText variant="largeTitle" style={styles.title}>
            С возвращением
          </ThemedText>
          <ThemedText variant="body" color="secondary" style={styles.subtitle}>
            Войдите, чтобы продолжить общение
          </ThemedText>

          <View style={styles.form}>
            <TextField
              label="Имя пользователя"
              value={username}
              onChangeText={(t) => { setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, '')); setError(null); }}
              placeholder="username"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              maxLength={32}
              iconLeft="AtSign"
            />
            <TextField
              label="Пароль"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(null); }}
              placeholder="Введите пароль"
              secureTextEntry={!showPassword}
              autoComplete="password"
              iconLeft="Lock"
              iconRight={showPassword ? 'EyeOff' : 'Eye'}
              onIconRightPress={() => setShowPassword((v) => !v)}
              onSubmitEditing={handleSubmit}
            />

            {error ? (
              <ThemedText variant="footnote" color="error" style={styles.error}>
                {error}
              </ThemedText>
            ) : null}

            <Button
              title="Войти"
              size="lg"
              fullWidth
              onPress={handleSubmit}
              disabled={!valid}
              loading={loading}
              style={{ marginTop: Spacing.four }}
            />
          </View>

          <View style={styles.footer}>
            <ThemedText variant="body" color="secondary">
              Ещё нет аккаунта?{' '}
            </ThemedText>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <ThemedText variant="body" color="accent" style={{ fontWeight: '600' }}>
                Зарегистрироваться
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.six,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.four,
  },
  title: { marginBottom: Spacing.two },
  subtitle: { marginBottom: Spacing.seven },
  form: { gap: Spacing.four, marginBottom: Spacing.four },
  error: { marginTop: Spacing.two },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: Spacing.four,
  },
});
