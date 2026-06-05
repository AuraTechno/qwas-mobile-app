/**
 * VoicePlayer — inline плеер голосовых сообщений.
 */

import { useState, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface Props {
  uri: string;
  durationSec?: number;
  isMe?: boolean;
  isPlaying?: boolean;
  onPlayingChange?: (playing: boolean) => void;
}

export default function VoicePlayer({ uri, durationSec = 0, isMe, isPlaying, onPlayingChange }: Props) {
  const theme = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(durationSec);
  const playing = isPlaying ?? false;
  const internalPlaying = useRef(false);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync().catch(() => {});
    };
  }, [sound]);

  useEffect(() => {
    if (sound && !isPlaying && internalPlaying.current) {
      sound.pauseAsync();
      internalPlaying.current = false;
    }
  }, [isPlaying, sound]);

  async function toggle() {
    if (loading) return;
    if (!sound) {
      setLoading(true);
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
        const { sound: s } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
        s.setOnPlaybackStatusUpdate((st: any) => {
          if (st.isLoaded) {
            setPos(Math.floor((st.positionMillis || 0) / 1000));
            if (st.durationMillis) setDur(Math.floor(st.durationMillis / 1000));
            if (st.didJustFinish) {
              internalPlaying.current = false;
              setPos(0);
              onPlayingChange?.(false);
            }
          }
        });
        setSound(s);
        internalPlaying.current = true;
        onPlayingChange?.(true);
      } catch (e) {
        console.error('Voice play error', e);
      } finally {
        setLoading(false);
      }
    } else {
      if (internalPlaying.current) {
        await sound.pauseAsync();
        internalPlaying.current = false;
        onPlayingChange?.(false);
      } else {
        await sound.playAsync();
        internalPlaying.current = true;
        onPlayingChange?.(true);
      }
    }
  }

  const total = dur || durationSec;
  const progress = total > 0 ? pos / total : 0;

  return (
    <View style={styles.row}>
      <Pressable onPress={toggle} disabled={loading} style={[styles.btn, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : theme.accent }]}>
        {loading ? (
          <ActivityIndicator color={isMe ? '#fff' : '#fff'} size="small" />
        ) : (
          <Icon name={playing ? 'Pause' : 'Play'} size={18} color="#fff" />
        )}
      </Pressable>
      <View style={styles.waveform}>
        {[...Array(28)].map((_, i) => {
          const active = i / 28 < progress;
          const h = 6 + Math.abs(Math.sin(i * 0.7)) * 14;
          return (
            <View
              key={i}
              style={{
                width: 2,
                height: h,
                borderRadius: 1,
                backgroundColor: active
                  ? (isMe ? '#fff' : theme.accent)
                  : (isMe ? 'rgba(255,255,255,0.4)' : theme.textTertiary),
                marginHorizontal: 1,
              }}
            />
          );
        })}
      </View>
      <ThemedText
        variant="caption1"
        style={{ color: isMe ? '#fff' : theme.text, marginLeft: Spacing.two, minWidth: 36 }}
      >
        {`${Math.floor(pos / 60)}:${String(pos % 60).padStart(2, '0')}`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minWidth: 180 },
  btn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 24 },
});
