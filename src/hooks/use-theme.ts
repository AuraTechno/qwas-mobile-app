/**
 * Хук темы — iOS style (light/dark, без midnight).
 */

import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/store/settings';

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  const userTheme = useSettings((s) => s.theme);
  let effective: 'light' | 'dark';
  if (userTheme === 'light') effective = 'light';
  else if (userTheme === 'dark') effective = 'dark';
  else effective = scheme === 'dark' ? 'dark' : 'light';
  return Colors[effective] as ThemeColors;
}

export function useColorSchemeName(): 'light' | 'dark' {
  const scheme = useColorScheme();
  const userTheme = useSettings((s) => s.theme);
  if (userTheme === 'light') return 'light';
  if (userTheme === 'dark') return 'dark';
  return scheme === 'dark' ? 'dark' : 'light';
}
