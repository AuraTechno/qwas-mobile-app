/**
 * Image viewer — fullscreen просмотр с зумом (pinch).
 */

import { useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image as RNImage } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function ImageViewer() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = Math.max(1, Math.min(5, savedScale.value * e.scale)); })
    .onEnd(() => { savedScale.value = scale.value; });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
      }
    });

  const composed = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Icon name="X" size={28} color="#fff" />
        </Pressable>
        <GestureDetector gesture={composed}>
          <Animated.View style={[styles.imageWrap, animStyle]}>
            <RNImage
              source={{ uri: uri || '' }}
              style={{ width, height }}
              resizeMode="contain"
              onLoad={() => setLoading(false)}
            />
            {loading && (
              <View style={styles.loading}>
                <ActivityIndicator color="#fff" size="large" />
              </View>
            )}
          </Animated.View>
        </GestureDetector>
        <View style={styles.footer}>
          <ThemedText variant="caption1" style={{ color: '#fff', opacity: 0.7 }}>
            Двойной тап или щипок для масштаба
          </ThemedText>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  closeBtn: { position: 'absolute', top: 50, right: 16, zIndex: 10, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  imageWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
});
