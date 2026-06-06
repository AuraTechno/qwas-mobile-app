/**
 * PollCreateModal — create a poll with options.
 */

import { useState } from 'react';
import { Modal, Pressable, View, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: { question: string; isAnonymous: boolean; isMultiple: boolean; options: string[] }) => void;
}

export default function PollCreateModal({ visible, onClose, onCreate }: Props) {
  const theme = useTheme();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isMultiple, setIsMultiple] = useState(false);

  function update(i: number, v: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  }

  function add() {
    if (options.length < 10) setOptions((p) => [...p, '']);
  }

  function remove(i: number) {
    if (options.length <= 2) {
      Alert.alert('Минимум 2 варианта');
      return;
    }
    setOptions((p) => p.filter((_, idx) => idx !== i));
  }

  function submit() {
    const q = question.trim();
    const valid = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!q) { Alert.alert('Укажите вопрос'); return; }
    if (valid.length < 2) { Alert.alert('Минимум 2 варианта ответа'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCreate({ question: q, isAnonymous, isMultiple, options: valid });
    setQuestion(''); setOptions(['', '']); setIsAnonymous(false); setIsMultiple(false);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.bgSecondary }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <ThemedText variant="title3" style={{ fontWeight: '700' }}>Создать опрос</ThemedText>
            <Pressable onPress={onClose}><Icon name="X" size={20} color={theme.textSecondary} /></Pressable>
          </View>
          <ScrollView style={{ maxHeight: 480 }}>
            <ThemedText variant="caption1" color="secondary" style={{ marginBottom: 4 }}>Вопрос</ThemedText>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Например, когда встречаемся?"
              placeholderTextColor={theme.textPlaceholder}
              style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.hairline }]}
              maxLength={200}
            />
            <ThemedText variant="caption1" color="secondary" style={{ marginTop: Spacing.three, marginBottom: 4 }}>Варианты</ThemedText>
            {options.map((opt, i) => (
              <View key={i} style={styles.optionRow}>
                <TextInput
                  value={opt}
                  onChangeText={(v) => update(i, v)}
                  placeholder={`Вариант ${i + 1}`}
                  placeholderTextColor={theme.textPlaceholder}
                  style={[styles.input, { flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.hairline }]}
                  maxLength={100}
                />
                {options.length > 2 ? (
                  <Pressable onPress={() => remove(i)} style={{ padding: 8 }}>
                    <Icon name="Trash2" size={18} color={theme.error} />
                  </Pressable>
                ) : null}
              </View>
            ))}
            {options.length < 10 ? (
              <Pressable onPress={add} style={[styles.addBtn, { borderColor: theme.hairline }]}>
                <Icon name="Plus" size={16} color={theme.accent} />
                <ThemedText variant="subhead" style={{ color: theme.accent, marginLeft: 4, fontWeight: '600' }}>Добавить вариант</ThemedText>
              </Pressable>
            ) : null}

            <Pressable onPress={() => setIsAnonymous((v) => !v)} style={styles.toggleRow}>
              <Icon name={isAnonymous ? 'CheckSquare' : 'Square'} size={20} color={isAnonymous ? theme.accent : theme.textSecondary} />
              <ThemedText variant="subhead" style={{ marginLeft: 8, flex: 1 }}>Анонимное голосование</ThemedText>
            </Pressable>
            <Pressable onPress={() => setIsMultiple((v) => !v)} style={styles.toggleRow}>
              <Icon name={isMultiple ? 'CheckSquare' : 'Square'} size={20} color={isMultiple ? theme.accent : theme.textSecondary} />
              <ThemedText variant="subhead" style={{ marginLeft: 8, flex: 1 }}>Можно выбрать несколько</ThemedText>
            </Pressable>
          </ScrollView>
          <Pressable onPress={submit} style={[styles.submitBtn, { backgroundColor: theme.accent }]}>
            <ThemedText variant="headline" style={{ color: '#fff', fontWeight: '700' }}>Создать</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.six, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },
  handle: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: 'rgba(120,120,128,0.36)', marginBottom: Spacing.two },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.three },
  input: { borderWidth: 0.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  submitBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: Spacing.three },
});
