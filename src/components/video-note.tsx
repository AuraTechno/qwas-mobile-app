/**
 * VideoNote — round, full-screen-on-tap video message bubble.
 */

import { useState } from 'react';
import { Modal, Pressable, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { mediaUrl } from '@/api/client';

interface Props {
  uri: string;
  durationSec: number;
  isMe: boolean;
  accentColor: string;
  onLongPress?: () => void;
}

export default function VideoNote({ uri, durationSec, isMe, accentColor, onLongPress }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const fullUri = mediaUrl(uri) || uri;

  function fmt(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        onLongPress={onLongPress}
        style={[styles.outer, { borderColor: accentColor }]}
      >
        <Video
          source={{ uri: fullUri }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isMuted
        />
        <View style={styles.gradient} pointerEvents="none" />
        <View style={styles.playOverlay} pointerEvents="none">
          <Icon name="Play" size={28} color="#fff" />
        </View>
        <View style={styles.durationBadge} pointerEvents="none">
          <ThemedText variant="caption2" style={{ color: '#fff', fontWeight: '700' }}>{fmt(durationSec)}</ThemedText>
        </View>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBg} onPress={() => setOpen(false)}>
          <View style={styles.modalContent}>
            {!loaded && <ActivityIndicator color="#fff" size="large" style={{ position: 'absolute' }} />}
            <Video
              source={{ uri: fullUri }}
              style={styles.fullVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping
              useNativeControls
              onLoad={() => setLoaded(true)}
            />
            <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
              <Icon name="X" size={20} color="#fff" />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const SIZE = 200;

const styles = StyleSheet.create({
  outer: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: '#000',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  playOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalContent: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  fullVideo: { width: '90%', height: '70%' },
  closeBtn: {
    position: 'absolute', top: 60, right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
});
