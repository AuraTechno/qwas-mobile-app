/**
 * Register screen.
 */

import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { apiGet } from '@/api/client';

type UsernameCheck = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const register = useAuth((s) => s.register);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [usernameCheck, setUsernameCheck] = useState<UsernameCheck>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleUsernameChange(text: string) {
    const clean = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    setError(null);
  }

  // Live username check
  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (username.length === 0) {
      setUsernameCheck('idle');
      return;
    }
    if (username.length < 3 || username.length > 32) {
      setUsernameCheck('invalid');
      return;
    }
    setUsernameCheck('checking');
    checkTimer.current = setTimeout(async () => {
      try {
        const r = await apiGet<{ available: boolean; reason?: string }>(
          `/api/v1/auth/check-username?username=${encodeURIComponent(username)}`,
          { auth: false },
        );
        if (r.available) {
          setUsernameCheck('available');
        } else {
          setUsernameCheck('taken');
        }
      } catch {
        setUsernameCheck('idle');
      }
    }, 400);
    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, [username]);

  const valid =
    usernameCheck === 'available' &&
    displayName.trim().length >= 1 &&
    password.length >= 8;

  async function handleSubmit() {
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await register(username.trim(), displayName.trim(), password);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e?.message || 'Не удалось создать аккаунт');
    } finally {
      setLoading(false);
    }
  }

  const usernameStatus = () => {
    if (usernameCheck === 'checking') return <ActivityIndicator size="small" color={theme.textSecondary} />;
    if (usernameCheck === 'available') return <Icon name="CheckCircle2" color={theme.online} size={18} />;
    if (usernameCheck === 'taken' || usernameCheck === 'invalid') return <Icon name="XCircle" color={theme.error} size={18} />;
    return null;
  };

  const usernameError =
    usernameCheck === 'taken' ? 'Это имя уже занято' :
    usernameCheck === 'invalid' ? '3-32 символа: a-z, 0-9, _' :
    null;

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
            Создать аккаунт
          </ThemedText>
          <ThemedText variant="body" color="secondary" style={styles.subtitle}>
            Зарегистрируйтесь, чтобы начать
          </ThemedText>

          <View style={styles.form}>
            <TextField
              label="Имя пользователя"
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="username"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={32}
              iconLeft="AtSign"
              iconRight={usernameCheck === 'checking' || usernameCheck === 'available' || usernameCheck === 'taken' || usernameCheck === 'invalid' ? 'Circle' : undefined}
              onIconRightPress={undefined}
              error={usernameError ?? undefined}
            />
            {usernameCheck === 'available' ? (
              <ThemedText variant="caption1" color="success" style={styles.hint}>
                Имя свободно
              </ThemedText>
            ) : null}

            <TextField
              label="Отображаемое имя"
              value={displayName}
              onChangeText={(t) => { setDisplayName(t); setError(null); }}
              placeholder="Как вас видеть?"
              maxLength={64}
              iconLeft="User"
            />

            <TextField
              label="Пароль"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(null); }}
              placeholder="Минимум 8 символов"
              secureTextEntry={!showPassword}
              iconLeft="Lock"
              iconRight={showPassword ? 'EyeOff' : 'Eye'}
              onIconRightPress={() => setShowPassword((v) => !v)}
              error={password.length > 0 && password.length < 8 ? 'Минимум 8 символов' : undefined}
            />

            {error ? (
              <ThemedText variant="footnote" color="error">
                {error}
              </ThemedText>
            ) : null}

            <Button
              title="Создать аккаунт"
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
              Уже есть аккаунт?{' '}
            </ThemedText>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <ThemedText variant="body" color="accent" style={{ fontWeight: '600' }}>
                Войти
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
  hint: { marginTop: -Spacing.three, marginLeft: 4 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: Spacing.four,
  },
});
