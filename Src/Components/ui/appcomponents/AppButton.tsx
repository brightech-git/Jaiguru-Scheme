import { Text } from '../../Typography/FontText';
// Src/Components/ui/appcomponents/AppButton.tsx
import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import theme from '../../../Utills/AppTheme';

const { COLORS, FONTS, SIZES, ELEVATION, moderateScale } = theme;

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  iconSize?: number;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  iconSize,
  fullWidth = true,
  style,
  textStyle,
}: AppButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 24 }).start();

  const isDisabled = disabled || loading;

  const heights: Record<ButtonSize, number> = {
    sm: moderateScale(38),
    md: moderateScale(48),
    lg: moderateScale(56),
  };
  const fontSizes: Record<ButtonSize, number> = { sm: SIZES.text.sm, md: SIZES.text.md, lg: SIZES.text.lg };
  const iconSizes: Record<ButtonSize, number> = { sm: 16, md: 20, lg: 22 };

  type VariantColors = { bg: string; border: string; text: string; loaderColor: string };
  const variants: Record<ButtonVariant, VariantColors> = {
    primary: { bg: COLORS.brand, border: COLORS.brand, text: COLORS.contentOnBrand, loaderColor: COLORS.contentOnBrand },
    secondary: { bg: COLORS.surfaceSunken, border: COLORS.surfaceSunken, text: COLORS.contentPrimary, loaderColor: COLORS.contentPrimary },
    outline: { bg: 'transparent', border: COLORS.borderBrand, text: COLORS.contentBrand, loaderColor: COLORS.contentBrand },
    ghost: { bg: 'transparent', border: 'transparent', text: COLORS.contentSecondary, loaderColor: COLORS.contentSecondary },
    danger: { bg: COLORS.danger, border: COLORS.danger, text: COLORS.contentOnInverse, loaderColor: COLORS.contentOnInverse },
    // "gold" is now the cream variant: cream fill, magenta text (9.4:1)
    gold: { bg: COLORS.accent, border: COLORS.accentSubtle, text: COLORS.contentOnAccent, loaderColor: COLORS.contentOnAccent },
  };
  const vc = variants[variant];
  const iSize = iconSize ?? iconSizes[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onIn}
      onPressOut={onOut}
      activeOpacity={1}
      disabled={isDisabled}
      // The passed-in `style` (e.g. `{ flex: 1 }` for side-by-side buttons in
      // a row) has to land on THIS outer wrapper, since it's the actual flex
      // child laid out by the parent row. Previously `style` only reached the
      // inner Animated.View below, so with fullWidth's default `width: '100%'`
      // still on this outer view, two buttons in a row would each claim the
      // full row width and overlap/clip each other — the "Confirm/Cancel
      // buttons not showing" bug.
      style={[fullWidth && { width: '100%' }, style]}
    >
      <Animated.View
        style={[
          styles.btn,
          {
            height: heights[size],
            backgroundColor: isDisabled ? COLORS.border : vc.bg,
            borderColor: isDisabled ? COLORS.border : vc.border,
            borderWidth: variant === 'outline' ? 1.5 : 0,
            transform: [{ scale }],
            ...(variant === 'primary' || variant === 'danger' ? ELEVATION.floating : {}),
            ...(variant === 'gold' ? ELEVATION.brandGlow : {}),
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={vc.loaderColor} size="small" />
        ) : (
          <>
            {leftIcon && (
              <Icon
                name={leftIcon}
                size={iSize}
                color={isDisabled ? COLORS.contentDisabled : vc.text}
                style={{ marginRight: 6 }}
              />
            )}
            <Text
              style={[
                styles.label,
                { fontSize: fontSizes[size], color: isDisabled ? COLORS.contentDisabled : vc.text, fontFamily: FONTS.family.semiBold },
                textStyle,
              ]}
            >
              {label}
            </Text>
            {rightIcon && (
              <Icon
                name={rightIcon}
                size={iSize}
                color={isDisabled ? COLORS.contentDisabled : vc.text}
                style={{ marginLeft: 6 }}
              />
            )}
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radius.control,
    paddingHorizontal: SIZES.space.xl,
  },
  label: {
    letterSpacing: 0.3,
  },
});
