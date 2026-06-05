/**
 * MessageContextMenu — bottom sheet with actions for a message.
 */

import { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Modal, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';
import type { Message } from '@/types';

export type MessageAction = 'reply' | 'edit' | 'delete' | 'copy' | 'pin' | 'react';

interface Props {
  visible: boolean;
  message: Message | null;
  isMe: boolean;
  isPinned: boolean;
  onClose: () => void;
  onAction: (action: MessageAction, emoji?: string) => void;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '😮', '😢'];

export default function MessageContextMenu({ visible, message, isMe, isPinned, onClose, onAction }: Props) {
  const theme = useTheme();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [visible]);

  function handleAction(action: MessageAction, emoji?: string) {
    if (action === 'delete') {
      Alert.alert('Удалить сообщение?', 'Это действие нельзя отменить', [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: () => onAction('delete') },
      ]);
      return;
    }
    onAction(action, emoji);
    onClose();
  }

  if (!message) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: theme.bgSecondary }]}>
          <View style={styles.reactions}>
            {REACTION_EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => handleAction('react', e)}
                style={({ pressed }) => [styles.reactionBtn, { opacity: pressed ? 0.5 : 1 }]}
              >
                <ThemedText variant="title2">{e}</ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.hairline }]} />

          <View style={styles.actions}>
            <ActionRow icon="Reply" label="Ответить" onPress={() => handleAction('reply')} />
            <ActionRow icon="Copy" label="Копировать текст" onPress={() => handleAction('copy')} />
            {isMe && message.type === 'text' && (
              <ActionRow icon="Edit" label="Редактировать" onPress={() => handleAction('edit')} />
            )}
            <ActionRow icon="Pin" label={isPinned ? 'Открепить' : 'Закрепить'} onPress={() => handleAction('pin')} />
            {isMe && (
              <ActionRow icon="Trash2" label="Удалить" destructive onPress={() => handleAction('delete')} />
            )}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

function ActionRow({
  icon,
  label,
  destructive,
  onPress,
}: {
  icon: any;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        { backgroundColor: pressed ? theme.bgTertiary : 'transparent' },
      ]}
    >
      <Icon name={icon} size={20} color={destructive ? '#ff3b30' : theme.accent} />
      <ThemedText variant="body" style={{ color: destructive ? '#ff3b30' : theme.text, marginLeft: Spacing.three }}>
        {label}
      </ThemedText>
    </Pressable>
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
  reactions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  reactionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 0.5,
    marginVertical: Spacing.two,
  },
  actions: {
    paddingHorizontal: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
  },
});
