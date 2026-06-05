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
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, logout } = useAuth();

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
          <Avatar username={user?.username || '?'} displayName={user?.displayName} size={80} />
          <View style={{ flex: 1, marginLeft: Spacing.four }}>
            <ThemedText variant="title3">{user?.displayName}</ThemedText>
            <ThemedText variant="subhead" color="secondary">@{user?.username}</ThemedText>
            {user?.bio ? (
              <ThemedText variant="subhead" color="secondary" style={{ marginTop: 4 }}>
                {user.bio}
              </ThemedText>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText variant="footnote" color="secondary" style={styles.sectionHeader}>
            АККАУНТ
          </ThemedText>
          <Row icon="User" title="Редактировать профиль" theme={theme} onPress={() => {}} />
          <Row icon="KeyRound" title="Безопасность" theme={theme} onPress={() => {}} />
          <Row icon="Smartphone" title="Активные устройства" theme={theme} onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <ThemedText variant="footnote" color="secondary" style={styles.sectionHeader}>
            ВНЕШНИЙ ВИД
          </ThemedText>
          <Row icon="Palette" title="Тема оформления" value="Авто" theme={theme} onPress={() => {}} />
          <Row icon="Languages" title="Язык" value="Русский" theme={theme} onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <ThemedText variant="footnote" color="secondary" style={styles.sectionHeader}>
            УВЕДОМЛЕНИЯ
          </ThemedText>
          <Row icon="Bell" title="Push-уведомления" theme={theme} right={<Switch value={true} />} />
          <Row icon="Volume2" title="Звуки" theme={theme} right={<Switch value={true} />} />
          <Row icon="Vibrate" title="Вибрация" theme={theme} right={<Switch value={true} />} />
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
});
