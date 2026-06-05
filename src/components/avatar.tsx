/**
 * Avatar — круг с градиентом и инициалами.
 */

import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { avatarColorFor, Radius } from '@/constants/theme';

interface Props {
  username: string;
  displayName?: string | null;
  size?: number;
  uri?: string | null;
}

function initials(displayName?: string | null, username?: string): string {
  const source = (displayName || username || '').trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Avatar({ username, displayName, size = 48, uri }: Props) {
  const [c1, c2] = avatarColorFor(username);
  const fontSize = size * 0.4;
  const radius = size / 2;

  if (uri) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c1 }]} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[c1, c2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: '#fff',
          fontSize,
          fontWeight: '700',
          letterSpacing: 0.5,
        }}
      >
        {initials(displayName, username)}
      </Text>
    </LinearGradient>
  );
}
