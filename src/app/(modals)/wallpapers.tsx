/**
 * Wallpapers screen — pick a chat background gradient.
 */

import { Stack, useRouter } from 'expo-router';
import { ScrollView, Pressable, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { useSettings, WALLPAPERS, type WallpaperId } from '@/store/settings';
import { Spacing, Radius } from '@/constants/theme';

export default function Wallpapers() {
  const router = useRouter();
  const theme = useTheme();
  const wallpaper = useSettings((s) => s.wallpaper);
  const setWallpaper = useSettings((s) => s.setWallpaper);

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen
        options={{
          title: 'Обои чата',
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.accent,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={{ padding: Spacing.three }}>
        <ThemedText variant="footnote" color="secondary" style={{ marginBottom: Spacing.three }}>
          Выберите фон для всех чатов.
        </ThemedText>
        <View style={styles.grid}>
          {WALLPAPERS.map((wp) => {
            const selected = wp.id === wallpaper;
            const [c1, c2] = wp.id === 'none' ? [theme.bg, theme.bg] : wp.light;
            return (
              <Pressable
                key={wp.id}
                onPress={() => setWallpaper(wp.id)}
                style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={[styles.preview, { backgroundColor: c1, borderColor: selected ? theme.accent : theme.hairline, borderWidth: selected ? 2.5 : 0.5 }]}>
                  {wp.id !== 'none' && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: c2, opacity: 0.5 }]} />
                  )}
                  {selected && (
                    <View style={styles.checkWrap}>
                      <Icon name="Check" size={18} color="#fff" />
                    </View>
                  )}
                </View>
                <ThemedText
                  variant="caption2"
                  align="center"
                  style={{ marginTop: 6, fontWeight: selected ? '700' : '500', color: selected ? theme.accent : theme.text }}
                >
                  {wp.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cell: { width: '48%', alignItems: 'center', marginBottom: Spacing.three },
  preview: {
    width: '100%',
    aspectRatio: 1.3,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
});
