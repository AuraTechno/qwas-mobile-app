/**
 * TextField — iOS-style input с floating label и focus state.
 */

import { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  type TextInputProps,
  StyleSheet,
  Pressable,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { Icon, type IconName } from '@/components/icon';


interface Props extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label?: string;
  error?: string;
  iconLeft?: IconName;
  iconRight?: IconName;
  onIconRightPress?: () => void;
}

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, iconLeft, iconRight, onIconRightPress, onFocus, onBlur, ...rest },
  ref,
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <ThemedText
          variant="footnote"
          color={error ? 'error' : focused ? 'accent' : 'secondary'}
          style={styles.label}
        >
          {label}
        </ThemedText>
      ) : null}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.bgSecondary,
            borderColor: error ? theme.error : focused ? theme.accent : 'transparent',
            borderWidth: error || focused ? 1 : 0,
          },
        ]}
      >
        {iconLeft ? (
          <View style={styles.iconLeft}>
            <Icon name={iconLeft} size={18} color={theme.textSecondary} />
          </View>
        ) : null}
        <TextInput
          ref={ref}
          {...rest}
          style={[
            Typography.body,
            { color: theme.text, flex: 1, paddingVertical: Spacing.three },
          ]}
          placeholderTextColor={theme.textPlaceholder}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {iconRight ? (
          <Pressable onPress={onIconRightPress} style={styles.iconRight} hitSlop={8}>
            <Icon name={iconRight} size={18} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <ThemedText variant="caption1" color="error" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    minHeight: 44,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  error: {
    marginTop: 4,
    marginLeft: 4,
  },
});
