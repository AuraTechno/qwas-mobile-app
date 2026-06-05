import { Text, type TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Typography } from '@/constants/theme';

type Variant = keyof typeof Typography;

interface Props extends TextProps {
  variant?: Variant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'error' | 'success' | 'inverted';
  align?: 'left' | 'center' | 'right';
}

export function ThemedText({
  variant = 'body',
  color = 'primary',
  align,
  style,
  ...rest
}: Props) {
  const theme = useTheme();
  const colorMap = {
    primary: theme.text,
    secondary: theme.textSecondary,
    tertiary: theme.textTertiary,
    accent: theme.accent,
    error: theme.error,
    success: theme.online,
    inverted: theme.bg,
  };
  return (
    <Text
      {...rest}
      style={[
        Typography[variant],
        { color: colorMap[color], textAlign: align },
        style,
      ]}
    />
  );
}
