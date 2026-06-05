/**
 * VoiceRecorder — modal для записи голосовых сообщений.
 */

import { useEffect, useState, useRef } from 'react';
import { Modal, View, StyleSheet, Pressable, Animated } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSend: (uri: string, durationMs: number) => void;
}

export default function VoiceRecorder({ visible, onClose, onSend }: Props) {
  const theme = useTheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [duration, setDuration] = useState(0);
  const [permission, setPermission] = useState<boolean | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) {
      (async () => {
        const { granted } = await Audio.requestPermissionsAsync();
        setPermission(granted);
        if (granted) {
          await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
          startRecording();
        }
      })();
    } else {
      cleanup();
    }
    return () => { cleanup(); };
  }, [visible]);

  useEffect(() => {
    if (recording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [recording]);

  async function startRecording() {
    try {
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 100), 100);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (recording) {
      try { await recording.stopAndUnloadAsync(); } catch {}
      setRecording(null);
    }
    setDuration(0);
  }

  async function stopAndSend() {
    if (!recording) { onClose(); return; }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const ms = (status as any).durationMillis ?? duration;
      setRecording(null);
      if (uri && ms > 500) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSend(uri, ms);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
    onClose();
  }

  function cancel() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cleanup();
    onClose();
  }

  const seconds = Math.floor(duration / 1000);
  const formatted = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
      <View style={styles.overlay}>
        <View style={[styles.panel, { backgroundColor: theme.bgSecondary }]}>
          <Animated.View style={[styles.pulse, { backgroundColor: theme.error, transform: [{ scale: pulseAnim }] }]}>
            <Icon name="Mic" size={28} color="#fff" />
          </Animated.View>
          <ThemedText variant="title2" style={{ marginTop: Spacing.four }}>
            {formatted}
          </ThemedText>
          <ThemedText variant="subhead" color="secondary" style={{ marginTop: 4 }}>
            {permission === false ? 'Нет доступа к микрофону' : 'Идёт запись...'}
          </ThemedText>

          <View style={styles.controls}>
            <Pressable
              onPress={cancel}
              style={[styles.cancelBtn, { backgroundColor: theme.bgTertiary }]}
            >
              <Icon name="X" size={22} color={theme.text} />
              <ThemedText variant="footnote" style={{ marginTop: 4 }}>Отмена</ThemedText>
            </Pressable>
            <Pressable
              onPress={stopAndSend}
              disabled={duration < 500}
              style={[styles.sendBtn, { backgroundColor: theme.accent, opacity: duration < 500 ? 0.5 : 1 }]}
            >
              <Icon name="Send" size={22} color="#fff" />
              <ThemedText variant="footnote" color="inverted" style={{ marginTop: 4, color: '#fff' }}>Отправить</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  panel: { width: '100%', borderRadius: Radius.xl, padding: Spacing.six, alignItems: 'center' },
  pulse: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.five },
  cancelBtn: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
});
