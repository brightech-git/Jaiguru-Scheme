import ApiImage from '../../ApiImage';
import { Text } from '../../Typography/FontText';
// Src/Components/ui/appcomponents/AppAvatar.tsx
import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import theme from '../../../Utills/AppTheme';

const { COLORS, FONTS } = theme;

export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

const DIMENSION_BY_SIZE: Record<AvatarSize, number> = {
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 88,
};

const FONT_SIZE_BY_SIZE: Record<AvatarSize, number> = {
  small: 14,
  medium: 18,
  large: 24,
  xlarge: 32,
};

export interface AppAvatarProps {
  uri?: string;
  initials?: string;
  size?: AvatarSize;
  style?: StyleProp<ViewStyle>;
}

export default function AppAvatar({ uri, initials, size = 'medium', style }: AppAvatarProps) {
  const dimension = DIMENSION_BY_SIZE[size];
  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (uri) {
    return <ApiImage source={{ uri }} style={[containerStyle, style] as any} />;
  }

  return (
    <View style={[containerStyle, style]}>
      <Text style={{ fontFamily: FONTS.family.semiBold, fontSize: FONT_SIZE_BY_SIZE[size], color: COLORS.contentSecondary }}>
        {(initials || '?').slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}
