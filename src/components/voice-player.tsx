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

const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;

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
  const [speed, setSpeed] = useState<number>(1);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const playing = isPlaying ?? false;
  const internalPlaying = useRef(false);

  useEffect(() => {
    if (sound) {
      sound.setRateAsync(speed, true).catch(() => {});
    }
  }, [sound, speed]);

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
      <Pressable
        onPress={() => setSpeedMenuOpen((v) => !v)}
        style={[styles.speedBtn, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : theme.bgTertiary }]}
      >
        <ThemedText variant="caption2" style={{ color: isMe ? '#fff' : theme.text, fontWeight: '700' }}>
          {speed}x
        </ThemedText>
      </Pressable>
      {speedMenuOpen && (
        <View style={[styles.speedMenu, { backgroundColor: theme.bgSecondary, borderColor: theme.hairline }]}>
          {SPEED_OPTIONS.map((s) => (
            <Pressable
              key={s}
              onPress={() => { setSpeed(s); setSpeedMenuOpen(false); }}
              style={({ pressed }) => [styles.speedOpt, { opacity: pressed ? 0.5 : 1 }]}
            >
              <ThemedText
                variant="caption1"
                style={{ color: s === speed ? theme.accent : theme.text, fontWeight: s === speed ? '700' : '400' }}
              >
                {s}x
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minWidth: 180, position: 'relative' },
  btn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 24 },
  speedBtn: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  speedMenu: {
    position: 'absolute',
    bottom: 36,
    right: 0,
    borderRadius: 10,
    borderWidth: 0.5,
    paddingVertical: 4,
    paddingHorizontal: 4,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  speedOpt: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
