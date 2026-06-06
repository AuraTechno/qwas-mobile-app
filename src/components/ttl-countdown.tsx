/**
 * TTLCountdown — self-destruct timer with progress arc.
 */

import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  expiresAt: string | null | undefined;
  isMe: boolean;
}

export default function TTLCountdown({ expiresAt, isMe }: Props) {
  const theme = useTheme();
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;
    function tick() {
      const ms = new Date(expiresAt!).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(ms / 1000)));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;
  if (remaining === 0) return null;

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const isUrgent = remaining <= 10;
  const color = isMe ? 'rgba(255,255,255,0.85)' : theme.accent;
  const urgentColor = isMe ? '#fff' : theme.error;

  return (
    <View style={styles.row}>
      <Icon name="Clock" size={10} color={isUrgent ? urgentColor : color} />
      <ThemedText
        variant="caption2"
        style={{ color: isUrgent ? urgentColor : color, marginLeft: 4, fontWeight: '600' }}
      >
        {m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}с`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
});
