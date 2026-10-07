import { Text } from '../../Typography/FontText';
// Src/Components/ui/appcomponents/AppSectionHeader.tsx
import React from 'react';
import { View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import theme from '../../../Utills/AppTheme';

const { COLORS, FONTS, SIZES } = theme;

export interface AppSectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function AppSectionHeader({ title, actionLabel, onActionPress, style }: AppSectionHeaderProps) {
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SIZES.space.md },
        style,
      ]}
    >
      <Text style={FONTS.subheading}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onActionPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[FONTS.bodyEmphasis, { color: COLORS.contentBrand }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
