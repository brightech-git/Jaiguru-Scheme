import { Text } from '../../../Components/Typography/FontText';
// Src/Screens/Home/components/GreetingSection.tsx
// -----------------------------------------------------------------------------
// Greeting + customer name + member ID. Fades / slides in on mount.
// -----------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import theme from '../../../Utills/AppTheme';

const { COLORS, SIZES, FONTS } = theme;

export interface GreetingSectionProps {
  greeting: string;
  name: string;
  // memberId: string;
}

const GreetingSection: React.FC<GreetingSectionProps> = ({ greeting, name,  }) => {
  const todayDay = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    timeZone: 'Asia/Kolkata',
  });
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [enter]);

  const style = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateX: interpolate(enter.value, [0, 1], [-16, 0]) }],
  }));

  return (
    <Animated.View style={style}>
      <Text style={styles.day}>{todayDay.toUpperCase()} · {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</Text>
      <Text style={styles.greeting}>{greeting},</Text>
      <Text style={styles.name}>Hi, {name || 'Welcome'}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  day: {
    fontFamily: FONTS.family.semiBold,
    fontSize: 9,
    letterSpacing: 1,
    color: COLORS.accentStrong,
    marginBottom: SIZES.space.sm,
  },
  greeting: {
    fontFamily: FONTS.family.medium,
    fontSize: 14,
    color: COLORS.contentOnBrand,
    opacity: 0.85,
  },
  welcome: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.lg,
    color: COLORS.contentOnBrand,
    marginTop: SIZES.space.xs,
  },
  name: {
    fontFamily: FONTS.family.semiBold,
    fontSize: 28,
    lineHeight: 38,
    color: COLORS.contentOnBrand,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.space.xs,
  },
  memberId: {
    fontFamily: FONTS.family.medium,
    fontSize: SIZES.text.xxs,
    color: COLORS.contentOnBrand,
    opacity: 0.85,
    marginLeft: SIZES.space.xs,
    letterSpacing: 0.3,
  },
});

export default React.memo(GreetingSection);
