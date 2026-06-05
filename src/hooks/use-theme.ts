/**
 * Хук темы — iOS style (light/dark, без midnight).
 */

import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' || scheme === 'dark' ? 'dark' : 'light';
  return Colors[theme] as ThemeColors;
}

export function useColorSchemeName(): 'light' | 'dark' {
  const scheme = useColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}
