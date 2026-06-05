/**
 * Welcome screen — entry point с логотипом и кнопками.
 */

import { View, Image, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.content}>
        <Animated.View
          entering={FadeIn.duration(800)}
          style={styles.logoWrapper}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.titleBlock}>
          <ThemedText variant="largeTitle" align="center">
            QWAS
          </ThemedText>
          <ThemedText
            variant="body"
            color="secondary"
            align="center"
            style={styles.subtitle}
          >
            Быстрые сообщения, голосовые звонки{'\n'}и общение без границ
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.actions}>
          <Button
            title="Создать аккаунт"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/register')}
          />
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={({ pressed }) => [styles.loginLink, pressed && { opacity: 0.5 }]}
          >
            <ThemedText variant="body" color="accent">
              Уже есть аккаунт? Войти
            </ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.six,
    paddingTop: Spacing.nine,
    paddingBottom: Spacing.four,
  },
  logoWrapper: {
    marginTop: Spacing.seven,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: Radius.xl,
  },
  titleBlock: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  subtitle: {
    marginTop: Spacing.two,
  },
  actions: {
    width: '100%',
    gap: Spacing.four,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
});
