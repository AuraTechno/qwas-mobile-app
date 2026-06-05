/**
 * Chat info modal — заглушка.
 */

import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function ChatInfoModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'modal',
          title: 'Информация',
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.accent,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.center}>
          <Icon name="Info" size={48} color={theme.textTertiary} />
          <ThemedText variant="headline" color="secondary" style={{ marginTop: Spacing.three }}>
            Информация о чате #{id}
          </ThemedText>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
