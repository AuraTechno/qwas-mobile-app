/**
 * Calls screen — заглушка.
 */

import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function CallsScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <ThemedText variant="largeTitle">Звонки</ThemedText>
      </View>
      <View style={styles.center}>
        <Icon name="Phone" size={48} color={theme.textTertiary} />
        <ThemedText variant="headline" color="secondary" style={{ marginTop: Spacing.three }}>
          История звонков
        </ThemedText>
        <ThemedText variant="subhead" color="tertiary" align="center" style={{ marginTop: Spacing.two, paddingHorizontal: Spacing.six }}>
          Звонки появятся здесь после первого вызова
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.six, paddingTop: Spacing.two, paddingBottom: Spacing.three },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
