/**
 * Хук темы — iOS style (light/dark, без midnight).
 */

import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/store/settings';

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  const userTheme = useSettings((s) => s.theme);
  const accent = useSettings((s) => s.accentColor);
  let effective: 'light' | 'dark';
  if (userTheme === 'light') effective = 'light';
  else if (userTheme === 'dark') effective = 'dark';
  else effective = scheme === 'dark' ? 'dark' : 'light';
  const base = Colors[effective] as ThemeColors;
  if (!accent) return base;
  return {
    ...base,
    accent: accent as any,
    accentMuted: hexToRgba(accent, effective === 'dark' ? 0.18 : 0.12) as any,
    sent: accent as any,
    tabBarActive: accent as any,
  };
}

export function useColorSchemeName(): 'light' | 'dark' {
  const scheme = useColorScheme();
  const userTheme = useSettings((s) => s.theme);
  if (userTheme === 'light') return 'light';
  if (userTheme === 'dark') return 'dark';
  return scheme === 'dark' ? 'dark' : 'light';
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
