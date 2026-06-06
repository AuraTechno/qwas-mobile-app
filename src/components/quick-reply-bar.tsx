/**
 * QuickReplyBar — swipe-to-reply preview + cancel.
 */

import { Pressable, View, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface Props {
  replyTo: { senderName: string; content: string; type: string } | null;
  onCancel: () => void;
}

export default function QuickReplyBar({ replyTo, onCancel }: Props) {
  const theme = useTheme();
  if (!replyTo) return null;

  function summary() {
    const r = replyTo;
    if (!r) return '';
    switch (r.type) {
      case 'image': return '🖼 Фото';
      case 'voice': return '🎤 Голосовое';
      case 'video': return '🎥 Видео';
      case 'video_note': return '⭕ Видеосообщение';
      case 'location': return '📍 Местоположение';
      case 'contact': return '👤 Контакт';
      case 'poll': return '📊 Опрос';
      case 'file': return '📎 Файл';
      default: return r.content || '...';
    }
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(160)}
      exiting={FadeOutDown.duration(120)}
      style={[styles.bar, { backgroundColor: theme.bgSecondary, borderTopColor: theme.hairline }]}
    >
      <View style={[styles.accent, { backgroundColor: theme.accent }]} />
      <View style={{ flex: 1 }}>
        <ThemedText variant="caption1" style={{ color: theme.accent, fontWeight: '700' }}>
          Ответ {replyTo.senderName}
        </ThemedText>
        <ThemedText variant="caption1" numberOfLines={1} color="secondary">
          {summary()}
        </ThemedText>
      </View>
      <Pressable onPress={onCancel} style={styles.cancelBtn}>
        <Icon name="X" size={18} color={theme.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: 0.5,
    gap: Spacing.two,
  },
  accent: { width: 3, height: 32, borderRadius: 1.5, marginRight: 8 },
  cancelBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
});
