import { View, type ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface Props extends ViewProps {
  bg?: 'primary' | 'secondary' | 'tertiary' | 'elevated';
}

export function ThemedView({ bg = 'primary', style, ...rest }: Props) {
  const theme = useTheme();
  const map = {
    primary: theme.bg,
    secondary: theme.bgSecondary,
    tertiary: theme.bgTertiary,
    elevated: theme.bgElevated,
  };
  return <View {...rest} style={[{ backgroundColor: map[bg] }, style]} />;
}
