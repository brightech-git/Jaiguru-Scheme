import { Text } from '../../Typography/FontText';
// Src/Components/ui/appcomponents/AppBadge.tsx
import React from 'react';
import { View, StyleProp, ViewStyle, TextStyle } from 'react-native';
import theme from '../../../Utills/AppTheme';

const { COLORS, SIZES, FONTS } = theme;

export type BadgeVariant = 'primary' | 'gold' | 'success' | 'error' | 'warning' | 'outline' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface AppBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function AppBadge({ label, variant = 'primary', size = 'md', style, textStyle }: AppBadgeProps) {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
    primary: { bg: COLORS.brand, text: COLORS.contentOnBrand },
    gold: { bg: COLORS.accent, text: COLORS.contentOnAccent },
    success: { bg: COLORS.success, text: COLORS.contentOnInverse },
    error: { bg: COLORS.danger, text: COLORS.contentOnInverse },
    warning: { bg: COLORS.warning, text: COLORS.contentOnInverse },
    outline: { bg: COLORS.transparent, text: COLORS.contentBrand, border: COLORS.borderBrand },
    neutral: { bg: COLORS.surfaceSunken, text: COLORS.contentSecondary },
  };
  const vc = variantStyles[variant];

  return (
    <View
      style={[
        {
          backgroundColor: vc.bg,
          borderRadius: SIZES.radius.pill,
          paddingHorizontal: size === 'sm' ? SIZES.space.sm : SIZES.space.md,
          paddingVertical: size === 'sm' ? 2 : SIZES.space.xs,
          alignSelf: 'flex-start',
          borderWidth: vc.border ? 1 : 0,
          borderColor: vc.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          FONTS.label,
          { color: vc.text, fontSize: size === 'sm' ? SIZES.text.xxs : SIZES.text.xxs },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
