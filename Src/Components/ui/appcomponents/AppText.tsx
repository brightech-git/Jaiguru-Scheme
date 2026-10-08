import { Text } from '../../Typography/FontText';
// Src/Components/ui/appcomponents/AppText.tsx
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import theme from '../../../Utills/AppTheme';

const { FONTS, COLORS } = theme;

export type TextVariant =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'bodyLarge' | 'body' | 'bodyMedium' | 'bodySmall' | 'bodyBold'
  | 'caption' | 'captionBold' | 'label' | 'labelUppercase'
  | 'button' | 'buttonLarge' | 'buttonSmall'
  | 'goldText' | 'blueText';

export interface AppTextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}

// The theme's typography scale was renamed (h1..h6 -> display/title/heading/…).
// This map keeps AppText's public `variant` API stable while pointing each one
// at a real FONTS entry. Without it every variant below fell through to
// FONTS.body, so headings silently rendered at body size.
const VARIANT_TO_FONT: Record<TextVariant, string> = {
  h1: 'display',
  h2: 'display2',
  h3: 'title',
  h4: 'heading',
  h5: 'subheadingLg',
  h6: 'subheading',
  bodyLarge: 'bodyLg',
  body: 'body',
  bodyMedium: 'bodyEmphasis',
  bodySmall: 'bodySm',
  bodyBold: 'bodyStrong',
  caption: 'caption',
  captionBold: 'label',
  label: 'label',
  labelUppercase: 'eyebrow',
  button: 'action',
  buttonLarge: 'action',
  buttonSmall: 'actionSm',
  goldText: 'bodyEmphasis',
  blueText: 'bodyEmphasis',
};

export default function AppText({
  children,
  variant = 'body',
  color,
  align = 'left',
  numberOfLines,
  style,
}: AppTextProps) {
  const variantStyle: TextStyle =
    (FONTS as any)[VARIANT_TO_FONT[variant] ?? variant] ?? FONTS.body;

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        variantStyle,
        { textAlign: align, color: color ?? (variantStyle as any).color ?? COLORS.contentPrimary ,textTransform: 'capitalize'} ,style,
      ]}
    >
      {children}
    </Text>
  );
}
