import { Text } from '../Typography/FontText';
// Src/Components/CommonHeader/CommonHeader.tsx
// -----------------------------------------------------------------------------
// Shared premium header used across the whole app. Safe-area aware (pads the
// status bar / notch / Dynamic Island correctly), champagne-gold styling, with
// three background modes:
//   • default    → solid white surface with gold accents
//   • transparent → no background (sits over a PremiumBackground / gradient)
//   • gradient    → filled champagne-gold gradient bar (dark ink text)
// API is fully backward-compatible with all existing callers.
// -----------------------------------------------------------------------------

import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import theme from '../../Utills/AppTheme';

const { COLORS, FONTS, SIZES, moderateScale, verticalScale, ELEVATION } = theme;
const GOLD_GRADIENT = COLORS.gradient.brand as [string, string, string];

interface HeaderProps {
  title?: string;
  subtitle?: string | null;

  showBack?: boolean;
  leftIconName?: string;
  leftIconSize?: number;
  leftIconColor?: string;
  onBackPress?: (() => void) | null;
  backIconName?: string;
  backIconColor?: string;

  rightIconName?: string | null;
  rightIconSize?: number;
  rightIconColor?: string;
  onRightPress?: (() => void) | null;

  backgroundColor?: string;
  textColor?: string;
  borderBottom?: boolean;
  shadow?: boolean;
  transparent?: boolean;
  /** Filled champagne-gold gradient bar (premium). */
  gradient?: boolean;
  animated?: boolean;
  centerTitle?: boolean;
  barStyle?: 'light-content' | 'dark-content' | 'default';

  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  centerComponent?: React.ReactNode;

  IconComponent?: React.ComponentType<any>;
}

const Header = ({
  title,
  subtitle = null,

  showBack = true,
  leftIconName,
  leftIconSize = moderateScale(24),
  leftIconColor,
  onBackPress = null,
  backIconName,
  backIconColor,

  rightIconName = null,
  rightIconSize = moderateScale(24),
  rightIconColor,
  onRightPress = null,

  backgroundColor,
  borderBottom = true,
  shadow = true,
  transparent = false,
  gradient = false,
  animated = true,
  centerTitle = true,
  barStyle = 'dark-content',

  leftComponent = null,
  rightComponent = null,
  centerComponent = null,

  IconComponent = Ionicons,
}: HeaderProps) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // On a filled gold gradient bar we use dark "ink on gold"; otherwise gold accents.
  const accentColor = gradient ? COLORS.contentOnAccent : COLORS.white;
  const titleColor = gradient ? COLORS.contentOnAccent : COLORS.contentPrimary;
  const iconBg = gradient ? COLORS.whiteAlpha50 : COLORS.brand;

  const resolvedLeftIconName = leftIconName || backIconName || 'arrow-back';
  const resolvedLeftIconColor = leftIconColor || backIconColor || accentColor;
  const resolvedRightIconColor = rightIconColor || accentColor;

  const slideAnim = useRef(new Animated.Value(animated ? -40 : 0)).current;
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [animated]);

  const handleBackPress = () => {
    if (onBackPress) onBackPress();
    else if (navigation.canGoBack()) navigation.goBack();
  };

  const bg = transparent ? 'transparent' : backgroundColor ?? COLORS.surfacePage;

  const Row = (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + moderateScale(6) },
        borderBottom && !gradient && styles.borderBottom,
        shadow && !transparent && styles.shadow,
        { transform: [{ translateY: slideAnim }], opacity: fadeAnim },
      ]}
    >
      {/* Left */}
      <View style={styles.side}>
        {leftComponent ? (
          leftComponent
        ) : showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
              <IconComponent name={resolvedLeftIconName} size={leftIconSize} color={resolvedLeftIconColor} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Center */}
      <View style={[styles.center, !centerTitle && { alignItems: 'flex-start' }]}>
        {centerComponent ? (
          centerComponent
        ) : (
          <>
            {!!title && (
              <Text numberOfLines={1} style={[styles.title, { color: titleColor }]}>
                {title}
              </Text>
            )}
            {!!subtitle && (
              <Text numberOfLines={1} style={[styles.subtitle, gradient && { color: COLORS.contentOnAccent }]}>
                {subtitle}
              </Text>
            )}
          </>
        )}
      </View>

      {/* Right */}
      <View style={styles.side}>
        {rightComponent ? (
          rightComponent
        ) : rightIconName ? (
          <TouchableOpacity style={styles.iconButton} onPress={onRightPress ?? undefined} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
              <IconComponent name={rightIconName} size={rightIconSize} color={resolvedRightIconColor} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </Animated.View>
  );

  return (
    <>
      <StatusBar barStyle={barStyle} backgroundColor="transparent" translucent />
      {gradient ? (
        <LinearGradient colors={GOLD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientWrap}>
          {Row}
        </LinearGradient>
      ) : (
        <View style={{ backgroundColor: bg }}>{Row}</View>
      )}
    </>
  );
};

export default Header;

/* ───────────────── Styles ───────────────── */

const styles = StyleSheet.create({
  gradientWrap: {
    borderBottomLeftRadius: SIZES.radius.xl,
    borderBottomRightRadius: SIZES.radius.xl,
    ...ELEVATION.brandGlow,
    shadowColor: COLORS.shadowBrand,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: verticalScale(56),
    paddingBottom: moderateScale(6),
    paddingHorizontal: SIZES.space.lg,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accentSubtle,
  },
  shadow: {
    ...ELEVATION.raised,
  },
  side: {
    minWidth: moderateScale(52),
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SIZES.space.sm,
  },
  title: {
    ...FONTS.heading,
    fontSize: SIZES.text.xl,
    textAlign: 'center',
  },
  subtitle: {
    ...FONTS.bodySm,
    color: COLORS.contentSecondary,
    marginTop: verticalScale(2),
  },
  iconButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: SIZES.radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: SIZES.radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: moderateScale(44),
  },
});
