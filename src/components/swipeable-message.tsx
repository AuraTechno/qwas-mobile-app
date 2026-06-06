/**
 * SwipeableMessage — wraps a message row to support swipe-to-reply.
 */

import { useCallback } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, withSpring, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface Props {
  onReply: () => void;
  children: React.ReactNode;
}

export default function SwipeableMessage({ onReply, children }: Props) {
  const tx = useSharedValue(0);

  const trigger = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReply();
  }, [onReply]);

  const swipe = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      if (e.translationX > 0 && e.translationX < 80) {
        tx.value = e.translationX;
      } else if (e.translationX < 0) {
        tx.value = 0;
      }
    })
    .onEnd((e) => {
      if (e.translationX > 60) {
        runOnJS(trigger)();
      }
      tx.value = withSpring(0, { damping: 18 });
    });

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  return (
    <GestureDetector gesture={swipe}>
      <Animated.View style={aStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}
