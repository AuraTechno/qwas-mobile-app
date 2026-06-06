/**
 * TTLPicker — choose self-destruct timer for next message.
 */

import { Modal, Pressable, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';

interface Props {
  visible: boolean;
  current: number | null;
  onClose: () => void;
  onSelect: (sec: number | null) => void;
}

const OPTIONS: { label: string; sec: number | null; icon: any }[] = [
  { label: 'Выкл', sec: null, icon: 'Clock' },
  { label: '5 сек', sec: 5, icon: 'Clock' },
  { label: '30 сек', sec: 30, icon: 'Clock' },
  { label: '1 мин', sec: 60, icon: 'Clock' },
  { label: '5 мин', sec: 300, icon: 'Clock' },
  { label: '1 час', sec: 3600, icon: 'Clock' },
  { label: '1 день', sec: 86400, icon: 'Clock' },
  { label: '1 неделя', sec: 604800, icon: 'Clock' },
];

export default function TTLPicker({ visible, current, onClose, onSelect }: Props) {
  const theme = useTheme();

  function pick(sec: number | null) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(sec);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={[styles.sheet, { backgroundColor: theme.bgSecondary }]}>
          <View style={styles.handle} />
          <ThemedText variant="title3" style={{ fontWeight: '700', marginBottom: Spacing.two }}>Таймер самоуничтожения</ThemedText>
          <ThemedText variant="caption1" color="secondary" style={{ marginBottom: Spacing.three }}>
            Сообщение исчезнет через выбранное время после прочтения.
          </ThemedText>
          {OPTIONS.map((o) => {
            const sel = o.sec === current;
            return (
              <Pressable
                key={String(o.sec)}
                onPress={() => pick(o.sec)}
                style={({ pressed }) => [
                  styles.row,
                  { borderColor: theme.hairline, backgroundColor: sel ? theme.accentMuted : 'transparent', opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Icon name={o.icon} size={18} color={sel ? theme.accent : theme.textSecondary} />
                <ThemedText variant="body" style={{ marginLeft: 12, flex: 1, color: sel ? theme.accent : theme.text, fontWeight: sel ? '700' : '400' }}>
                  {o.label}
                </ThemedText>
                {sel && <Icon name="Check" size={18} color={theme.accent} />}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.six, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },
  handle: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: 'rgba(120,120,128,0.36)', marginBottom: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderTopWidth: 0.5 },
});
