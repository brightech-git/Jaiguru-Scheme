import { Text } from '../../../../Components/Typography/FontText';
// Src/Screens/Auth/Register/components/RegisterButton.tsx
// -----------------------------------------------------------------------------
// Gold-gradient "Create Account" button with press-scale, loading spinner,
// disabled state, and a success check animation shown after registration.
// -----------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import theme from '../../../../Utills/AppTheme';

const { COLORS, SIZES, FONTS, ELEVATION } = theme;
const GOLD_GRADIENT = COLORS.gradient.brand as [string, string, string];

export interface RegisterButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  success?: boolean;
}

const RegisterButton: React.FC<RegisterButtonProps> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  success = false,
}) => {
  const pressed = useSharedValue(0);
  const check = useSharedValue(0);
  const isDisabled = disabled || loading || success;

  useEffect(() => {
    check.value = withTiming(success ? 1 : 0, { duration: 260 });
  }, [success, check]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.96 : 1, { damping: 15, stiffness: 220 }) }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: check.value,
    transform: [{ scale: check.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 1 - check.value,
  }));

  return (
    <Animated.View style={[styles.wrap, containerStyle, isDisabled && !success && styles.disabled]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => (pressed.value = 1)}
        onPressOut={() => (pressed.value = 0)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={styles.pressable}
      >
        <LinearGradient colors={GOLD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
          {loading ? (
            <ActivityIndicator color={COLORS.contentOnAccent} />
          ) : (
            <>
              <Animated.View style={[styles.center, labelStyle]}>
                <View style={styles.content}>
                  <MaterialCommunityIcons name="shield-check" size={SIZES.icon.md} color={COLORS.white} />
                  <Text style={styles.label}>{label}</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.center, styles.checkOverlay, checkStyle]} pointerEvents="none">
                <MaterialCommunityIcons name="check-decagram" size={SIZES.icon.lg} color={COLORS.contentOnAccent} />
              </Animated.View>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: SIZES.radius.xl,
    ...ELEVATION.brandGlow,
    shadowColor: COLORS.shadowBrand,
  },
  disabled: {
    opacity: 0.6,
  },
  pressable: {
    borderRadius: SIZES.radius.xl,
    overflow: 'hidden',
  },
  gradient: {
    height: SIZES.control.heightLg,
    borderRadius: SIZES.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.lg,
    letterSpacing: 0.4,
    color: COLORS.white,
    marginLeft: SIZES.space.sm,
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default React.memo(RegisterButton);
