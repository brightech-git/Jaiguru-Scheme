import { Text } from '../../../../Components/Typography/FontText';
// Src/Screens/Auth/Login/components/LoginButton.tsx
// -----------------------------------------------------------------------------
// Large gold-gradient primary button with press-scale, loading and disabled
// states plus an optional leading icon. Uses the global AppTheme.
// -----------------------------------------------------------------------------

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import theme from '../../../../Utills/AppTheme';

const { COLORS, SIZES, FONTS, ELEVATION } = theme;
type MCName = keyof typeof MaterialCommunityIcons.glyphMap;

const GOLD_GRADIENT = COLORS.gradient.brand as [string, string, string];

export interface LoginButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: MCName;
  accessibilityHint?: string;
}

const LoginButton: React.FC<LoginButtonProps> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon = 'shield-check',
  accessibilityHint,
}) => {
  const pressed = useSharedValue(0);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.96 : 1, { damping: 15, stiffness: 220 }) }],
  }));

  return (
    <Animated.View style={[styles.wrap, animatedStyle, isDisabled && styles.disabled]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => (pressed.value = 1)}
        onPressOut={() => (pressed.value = 0)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={styles.pressable}
      >
        <LinearGradient
          colors={GOLD_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.contentOnAccent} />
          ) : (
            <View style={styles.content}>
              <MaterialCommunityIcons name={icon} size={SIZES.icon.md} color={COLORS.white} />
              <Text style={styles.label}>{label}</Text>
            </View>
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
});

export default React.memo(LoginButton);
