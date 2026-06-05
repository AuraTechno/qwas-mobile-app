/**
 * Button — iOS-style с haptic feedback.
 */

import { Pressable, StyleSheet, ActivityIndicator, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  haptic?: boolean;
  style?: ViewStyle;
}

const heights: Record<Size, number> = { sm: 36, md: 48, lg: 56 };
const paddings: Record<Size, number> = { sm: Spacing.three, md: Spacing.four, lg: Spacing.five };
const fontVariant: Record<Size, 'subhead' | 'headline' | 'headline'> = {
  sm: 'subhead',
  md: 'headline',
  lg: 'headline',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  haptic = true,
  style,
}: Props) {
  const theme = useTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const height = heights[size];
  const padding = paddings[size];
  const fontVar = fontVariant[size];

  const content = (
    <View style={[styles.inner, { height, paddingHorizontal: padding }]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : theme.accent} />
      ) : (
        <>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <ThemedText
            variant={fontVar}
            color={variant === 'primary' || variant === 'danger' ? 'inverted' : 'accent'}
            style={{ fontWeight: '600' }}
          >
            {title}
          </ThemedText>
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.base,
          fullWidth && styles.fullWidth,
          { borderRadius: height / 2, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
          style,
        ]}
      >
        <LinearGradient
          colors={[theme.brand1, theme.brand2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]}
        />
        {content}
      </Pressable>
    );
  }

  const bg =
    variant === 'secondary' ? theme.accentMuted :
    variant === 'danger' ? theme.error :
    'transparent';

  const textColor = variant === 'danger' ? '#fff' : theme.accent;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: bg,
          borderRadius: height / 2,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        variant === 'ghost' && { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.hairline },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 6,
  },
});
