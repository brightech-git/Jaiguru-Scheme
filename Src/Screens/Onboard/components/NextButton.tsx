import { Text } from '../../../Components/Typography/FontText';
// Src/Screens/Onboard/components/NextButton.tsx
// -----------------------------------------------------------------------------
// Gold-gradient primary CTA with a tactile press (scale + shadow) animation and
// a subtle looping shimmer sweep. Optional trailing arrow icon.
// -----------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { COLORS, FONTS } from '../../../Utills/AppTheme';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export interface NextButtonProps {
  label: string;
  onPress: () => void;
  /** Show the trailing arrow (hidden on the final "Start Shopping" CTA). */
  showArrow?: boolean;
  accessibilityHint?: string;
}

const NextButton: React.FC<NextButtonProps> = ({
  label,
  onPress,
  showArrow = true,
  accessibilityHint,
}) => {
  const pressed = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    );
  }, [shimmer]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.96 : 1, { damping: 15, stiffness: 220 }) }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-160, 220]) }],
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 0.5, 0]),
  }));

  return (
    <Animated.View style={[styles.wrap, containerStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (pressed.value = 1)}
        onPressOut={() => (pressed.value = 0)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        style={styles.pressable}
      >
        <LinearGradient
          colors={[COLORS.brandMuted, COLORS.brand, COLORS.brandStrong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* moving shimmer highlight */}
          <View style={styles.shimmerClip} pointerEvents="none">
            <AnimatedGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.shimmer, shimmerStyle]}
            />
          </View>

          <Text style={styles.label}>{label}</Text>
          {showArrow && (
            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color={COLORS.white}
              style={styles.arrow}
            />
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: 26,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  pressable: {
    borderRadius: 26,
    overflow: 'hidden',
  },
  gradient: {
    height: 50,
    paddingHorizontal: 28,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmerClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 90,
  },
  label: {
    fontFamily: FONTS.family.bold,
    fontSize: 16,
    letterSpacing: 0.5,
    color: COLORS.white,
  },
  arrow: {
    marginLeft: 8,
  },
});

export default React.memo(NextButton);
