/**
 * Settings screen.
 */

import { View, StyleSheet, Pressable, Switch, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useAuth } from '@/store/auth';
import { useSettings, type ThemeMode } from '@/store/settings';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { theme: themeMode, accentColor, pushEnabled, soundEnabled, vibrateEnabled, setTheme, setAccent, setPush, setSound, setVibrate } = useSettings();

  const ACCENT_OPTIONS = [
    { name: 'Синий', value: '#007AFF' },
    { name: 'Голубой', value: '#5AC8FA' },
    { name: 'Красный', value: '#FF3B30' },
    { name: 'Оранжевый', value: '#FF9500' },
    { name: 'Жёлтый', value: '#FFCC00' },
    { name: 'Зелёный', value: '#34C759' },
    { name: 'Бирюзовый', value: '#30B0C7' },
    { name: 'Индиго', value: '#5856D6' },
    { name: 'Розовый', value: '#FF2D55' },
    { name: 'Фиолетовый', value: '#AF52DE' },
    { name: 'Коричневый', value: '#A2845E' },
    { name: 'Серый', value: '#8E8E93' },
  ];

  function pickTheme() {
    Alert.alert('Тема оформления', undefined, [
      { text: 'Авто', onPress: () => setTheme('auto') },
      { text: 'Светлая', onPress: () => setTheme('light') },
      { text: 'Тёмная', onPress: () => setTheme('dark') },
      { text: 'Отмена', style: 'cancel' },
    ]);
  }

  function handleLogout() {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
        },
      },
    ]);
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <ThemedText variant="largeTitle">Настройки</ThemedText>
        </View>

        <View style={styles.profile}>
          <Pressable
            onPress={() => router.push('/(modals)/edit-profile')}
            style={styles.profile}
          >
            <Avatar username={user?.username || '?'} displayName={user?.displayName} size={80} />
            <View style={{ flex: 1, marginLeft: Spacing.four }}>
              <ThemedText variant="title3">{user?.displayName}</ThemedText>
              <ThemedText variant="subhead" color="secondary">@{user?.username}</ThemedText>
              {user?.bio ? (
                <ThemedText variant="subhead" color="secondary" style={{ marginTop: 4 }}>
                  {user.bio}
                </ThemedText>
              ) : null}
              <ThemedText variant="caption1" color="accent" style={{ marginTop: 4 }}>
                Редактировать профиль
              </ThemedText>
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <ThemedText variant="footnote" color="secondary" style={styles.sectionHeader}>
            АККАУНТ
          </ThemedText>
          <Row icon="KeyRound" title="Безопасность" theme={theme} onPress={() => Alert.alert('Скоро')} />
          <Row icon="Smartphone" title="Активные устройства" theme={theme} onPress={() => router.push('/(modals)/sessions')} />
        </View>

        <View style={styles.section}>
          <ThemedText variant="footnote" color="secondary" style={styles.sectionHeader}>
            ВНЕШНИЙ ВИД
          </ThemedText>
          <Row icon="Palette" title="Тема оформления" value={themeMode === 'auto' ? 'Авто' : themeMode === 'light' ? 'Светлая' : 'Тёмная'} theme={theme} onPress={pickTheme} />
          <View style={{ paddingHorizontal: Spacing.four, paddingTop: Spacing.two }}>
            <ThemedText variant="footnote" color="secondary" style={{ paddingBottom: Spacing.two, textTransform: 'uppercase' }}>
              ЦВЕТ АКЦЕНТА
            </ThemedText>
            <View style={styles.colorRow}>
              {ACCENT_OPTIONS.map((c) => {
                const selected = accentColor === c.value || (!accentColor && c.value === '#007AFF');
                return (
                  <Pressable
                    key={c.value}
                    onPress={() => setAccent(c.value === '#007AFF' && accentColor === '#007AFF' ? null : c.value)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c.value, borderWidth: selected ? 3 : 0, borderColor: theme.text },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText variant="footnote" color="secondary" style={styles.sectionHeader}>
            УВЕДОМЛЕНИЯ
          </ThemedText>
          <Row icon="Bell" title="Push-уведомления" theme={theme} right={
            <Switch value={pushEnabled} onValueChange={setPush} trackColor={{ true: theme.accent }} />
          } />
          <Row icon="Volume2" title="Звуки" theme={theme} right={
            <Switch value={soundEnabled} onValueChange={setSound} trackColor={{ true: theme.accent }} />
          } />
          <Row icon="Vibrate" title="Вибрация" theme={theme} right={
            <Switch value={vibrateEnabled} onValueChange={setVibrate} trackColor={{ true: theme.accent }} />
          } />
        </View>

        <View style={styles.section}>
          <Row icon="HelpCircle" title="Помощь" theme={theme} onPress={() => {}} />
          <Row icon="Info" title="О приложении" value="v1.0.0" theme={theme} onPress={() => {}} />
        </View>

        <View style={[styles.section, { marginTop: Spacing.six }]}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutBtn, { backgroundColor: theme.error + '15', opacity: pressed ? 0.6 : 1 }]}
          >
            <Icon name="LogOut" size={20} color={theme.error} />
            <ThemedText variant="headline" color="error" style={{ marginLeft: Spacing.two }}>
              Выйти
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  title,
  value,
  onPress,
  right,
  theme,
}: {
  icon: any;
  title: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  theme: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.bgSecondary,
          opacity: pressed && onPress ? 0.6 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.accentMuted }]}>
        <Icon name={icon} size={18} color={theme.accent} />
      </View>
      <ThemedText variant="body" style={{ flex: 1 }}>{title}</ThemedText>
      {value ? <ThemedText variant="body" color="secondary">{value}</ThemedText> : null}
      {right}
      {onPress && !right ? <Icon name="ChevronRight" size={18} color={theme.textTertiary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.six, paddingTop: Spacing.two, paddingBottom: Spacing.three },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.four,
  },
  section: {
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.four,
    gap: 1,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    gap: Spacing.three,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingVertical: 4 },
  colorCircle: { width: 36, height: 36, borderRadius: 18 },
});
