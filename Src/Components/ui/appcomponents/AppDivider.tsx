import { Text } from '../../Typography/FontText';
// Src/Components/ui/appcomponents/AppDivider.tsx
import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import theme from '../../../Utills/AppTheme';

const { COLORS, SIZES, FONTS } = theme;

export interface AppDividerProps {
  direction?: 'horizontal' | 'vertical';
  color?: string;
  thickness?: number;
  spacing?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export default function AppDivider({
  direction = 'horizontal',
  color = COLORS.divider,
  thickness = 1,
  spacing,
  label,
  style,
}: AppDividerProps) {
  if (direction === 'vertical') {
    return (
      <View
        style={[
          { width: thickness, backgroundColor: color, marginHorizontal: spacing ?? SIZES.space.md },
          style,
        ]}
      />
    );
  }

  if (label) {
    return (
      <View style={[{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing ?? SIZES.space.md }, style]}>
        <View style={{ flex: 1, height: thickness, backgroundColor: color }} />
        <Text style={[FONTS.caption, { marginHorizontal: SIZES.space.sm }]}>{label}</Text>
        <View style={{ flex: 1, height: thickness, backgroundColor: color }} />
      </View>
    );
  }

  return (
    <View
      style={[{ height: thickness, backgroundColor: color, marginVertical: spacing ?? SIZES.space.md }, style]}
    />
  );
}
