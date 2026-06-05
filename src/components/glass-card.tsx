/**
 * GlassCard — стеклянный фон (blur на iOS, fallback на Android).
 */

import { Platform, View, type ViewProps, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme, useColorSchemeName } from '@/hooks/use-theme';
import { Radius } from '@/constants/theme';

interface Props extends ViewProps {
  intensity?: 'low' | 'medium' | 'high';
  radius?: number;
  border?: boolean;
  padding?: number;
}

const intensityMap = {
  low: Platform.OS === 'ios' ? 20 : 50,
  medium: Platform.OS === 'ios' ? 40 : 80,
  high: Platform.OS === 'ios' ? 60 : 100,
};

export function GlassCard({
  intensity = 'medium',
  radius = Radius.lg,
  border = true,
  padding,
  style,
  children,
  ...rest
}: Props) {
  const theme = useTheme();
  const scheme = useColorSchemeName();

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensityMap[intensity]}
        tint={scheme === 'dark' ? 'dark' : 'light'}
        style={[
          {
            borderRadius: radius,
            overflow: 'hidden',
            borderWidth: border ? StyleSheet.hairlineWidth : 0,
            borderColor: theme.glassBorder,
            padding,
          },
          style,
        ]}
        {...rest}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        {
          backgroundColor: theme.glass2,
          borderRadius: radius,
          borderWidth: border ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.glassBorder,
          padding,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
