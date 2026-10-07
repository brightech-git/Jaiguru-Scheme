import { Text } from '../../../../Components/Typography/FontText';
// Src/Screens/Auth/Login/components/LoginHeader.tsx
// -----------------------------------------------------------------------------
// Premium header: gold medallion logo with a looping shine sweep, brand name
// and trust subtitle. Fades + scales in on mount. Uses the global AppTheme.
// -----------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import theme from '../../../../Utills/AppTheme';

const { COLORS, SIZES, FONTS } = theme;
const MEDALLION = SIZES.icon.avatarLg + SIZES.space.xxxl;
const LOCAL_LOGO = require("../../../../Assets/Company/headerlogo.webp");

export interface LoginHeaderProps {
  brand?: string;
  subtitle?: string;
  logoUrl?: string | null;
}

const LoginHeader: React.FC<LoginHeaderProps> = ({
  brand = 'Jaiguru Jewellers',
  subtitle = 'Trusted Digital Gold Savings',
  logoUrl,
}) => {
  const enter = useSharedValue(0);

  useEffect(() => {
    enter.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
  }, [enter]);

  const medallionStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { scale: interpolate(enter.value, [0, 1], [0.7, 1]) },
      { translateY: interpolate(enter.value, [0, 1], [12, 0]) },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: interpolate(enter.value, [0, 1], [16, 0]) }],
  }));


  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.logoWrap, medallionStyle]}>
        <Image source={LOCAL_LOGO} style={styles.logoImg} resizeMode="contain" />
      </Animated.View>

      <Animated.View style={[styles.textBlock, textStyle]}>
        {/* <Text style={styles.brand} accessibilityRole="header">
          {brand}
        </Text> */}
        {/* <View style={styles.subtitleRow}>
          <MaterialCommunityIcons name="shield-check" size={SIZES.icon.xs} color={COLORS.contentBrand} />
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View> */}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
  },
  logoWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: '100%',
    height: undefined,
    aspectRatio: 1600 / 500,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: SIZES.space.lg,
  },
  brand: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.display3,
    letterSpacing: 0.3,
    color: COLORS.contentPrimary,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.space.xs,
  },
  subtitle: {
    fontFamily: FONTS.family.medium,
    fontSize: SIZES.text.sm,
    letterSpacing: 0.4,
    color: COLORS.contentSecondary,
    marginLeft: SIZES.space.xs,
  },
});

export default React.memo(LoginHeader);
