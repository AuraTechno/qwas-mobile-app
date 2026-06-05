/**
 * QWAS Design System — iOS style.
 * https://developer.apple.com/design/human-interface-guidelines/typography
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Backgrounds
    bg: '#FFFFFF',
    bgSecondary: '#F2F2F7',
    bgTertiary: '#FFFFFF',
    bgGrouped: '#F2F2F7',
    bgElevated: '#FFFFFF',

    // Glass
    glass1: 'rgba(255,255,255,0.7)',
    glass2: 'rgba(255,255,255,0.85)',
    glass3: 'rgba(255,255,255,0.95)',
    glassBorder: 'rgba(0,0,0,0.08)',

    // Accent (iOS system blue)
    accent: '#007AFF',
    accentMuted: 'rgba(0,122,255,0.12)',
    accent2: '#5856D6',

    // Brand gradient (paper plane)
    brand1: '#5e8ee7',
    brand2: '#2b5278',

    // Message bubbles
    sent: '#007AFF',
    sentText: '#FFFFFF',
    received: '#E9E9EB',
    receivedText: '#000000',

    // Text
    text: '#000000',
    textSecondary: 'rgba(60,60,67,0.6)',
    textTertiary: 'rgba(60,60,67,0.3)',
    textPlaceholder: 'rgba(60,60,67,0.3)',

    // Borders / dividers
    separator: 'rgba(60,60,67,0.29)',
    hairline: 'rgba(60,60,67,0.18)',

    // Status
    online: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',

    // Tab bar
    tabBarBg: 'rgba(255,255,255,0.85)',
    tabBarActive: '#007AFF',
    tabBarInactive: 'rgba(60,60,67,0.3)',

    // Overlays
    overlay: 'rgba(0,0,0,0.4)',
    modalBg: 'rgba(0,0,0,0.55)',
  },
  dark: {
    bg: '#000000',
    bgSecondary: '#1C1C1E',
    bgTertiary: '#2C2C2E',
    bgGrouped: '#000000',
    bgElevated: '#1C1C1E',

    glass1: 'rgba(28,28,30,0.6)',
    glass2: 'rgba(28,28,30,0.8)',
    glass3: 'rgba(28,28,30,0.95)',
    glassBorder: 'rgba(255,255,255,0.1)',

    accent: '#0A84FF',
    accentMuted: 'rgba(10,132,255,0.18)',
    accent2: '#5E5CE6',

    brand1: '#5e8ee7',
    brand2: '#2b5278',

    sent: '#0A84FF',
    sentText: '#FFFFFF',
    received: '#3A3A3C',
    receivedText: '#FFFFFF',

    text: '#FFFFFF',
    textSecondary: 'rgba(235,235,245,0.6)',
    textTertiary: 'rgba(235,235,245,0.3)',
    textPlaceholder: 'rgba(235,235,245,0.3)',

    separator: 'rgba(84,84,88,0.65)',
    hairline: 'rgba(84,84,88,0.45)',

    online: '#30D158',
    error: '#FF453A',
    warning: '#FF9F0A',
    success: '#30D158',

    tabBarBg: 'rgba(28,28,30,0.85)',
    tabBarActive: '#0A84FF',
    tabBarInactive: 'rgba(235,235,245,0.3)',

    overlay: 'rgba(0,0,0,0.55)',
    modalBg: 'rgba(0,0,0,0.75)',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = (typeof Colors)['light'];

// iOS HIG Typography scale
export const Typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, lineHeight: 41 },
  title1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  title2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  title3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 25 },
  headline: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 22 },
  callout: { fontSize: 16, fontWeight: '400' as const, lineHeight: 21 },
  subhead: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption1: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  caption2: { fontSize: 11, fontWeight: '400' as const, lineHeight: 13 },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, sans-serif',
    serif: 'Georgia, serif',
    rounded: 'system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, monospace',
  },
});

export const Spacing = {
  px: 1,
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
  nine: 48,
  ten: 64,
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

// Avatar gradient palette (8 colors for username → initials)
export const AvatarColors = [
  ['#FF6B6B', '#C92A2A'],
  ['#FFD43B', '#F08C00'],
  ['#51CF66', '#2F9E44'],
  ['#22B8CF', '#0B7285'],
  ['#5e8ee7', '#2b5278'],
  ['#845EF7', '#5F3DC4'],
  ['#F783AC', '#C2255C'],
  ['#FF922B', '#D9480F'],
] as const;

export function avatarColorFor(seed: string): readonly [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AvatarColors[Math.abs(h) % AvatarColors.length];
}
