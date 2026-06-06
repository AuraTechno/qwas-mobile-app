/**
 * AttachSheet — bottom sheet для выбора типа вложения.
 */

import { Modal, Pressable, View, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';

export type AttachAction = 'photo' | 'camera' | 'video' | 'video_note' | 'poll' | 'document' | 'location' | 'contact' | 'voice';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (action: AttachAction) => void;
}

const ACTIONS: { id: AttachAction; icon: any; label: string; color: string }[] = [
  { id: 'photo',      icon: 'ImagePlus',  label: 'Фото',             color: '#5ac8fa' },
  { id: 'camera',     icon: 'Camera',     label: 'Камера',           color: '#ff3b30' },
  { id: 'video',      icon: 'Video',      label: 'Видео',            color: '#af52de' },
  { id: 'video_note', icon: 'Circle',     label: 'Кружок',           color: '#ff375f' },
  { id: 'poll',       icon: 'BarChart2',  label: 'Опрос',            color: '#5856d6' },
  { id: 'document',   icon: 'FileText',   label: 'Файл',             color: '#007aff' },
  { id: 'location',   icon: 'MapPin',     label: 'Местоположение',   color: '#34c759' },
  { id: 'contact',    icon: 'UserPlus',   label: 'Контакт',          color: '#ff9500' },
  { id: 'voice',      icon: 'Mic',        label: 'Голосовое',        color: '#ff2d55' },
];

export default function AttachSheet({ visible, onClose, onSelect }: Props) {
  const theme = useTheme();

  function handle(id: AttachAction) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(id);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[styles.sheet, { backgroundColor: theme.bgSecondary }]}
        >
          <View style={styles.handle} />
          <View style={styles.grid}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => handle(a.id)}
                style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.5 : 1 }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: a.color }]}>
                  <Icon name={a.icon} size={24} color="#fff" />
                </View>
                <ThemedText variant="footnote" style={{ marginTop: 6, textAlign: 'center' }}>
                  {a.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(120,120,128,0.36)',
    marginBottom: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.two,
  },
  cell: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    minHeight: 92,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
