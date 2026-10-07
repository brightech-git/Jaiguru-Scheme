import { Text } from '../../Typography/FontText';
// Src/Components/ui/appcomponents/AppEmptyState.tsx
import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import theme from '../../../Utills/AppTheme';
import AppButton from './AppButton';

const { COLORS, SIZES, FONTS } = theme;

export interface AppEmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
}

export default function AppEmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
  style,
  iconSize = 56,
}: AppEmptyStateProps) {
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', padding: SIZES.space.xxl }, style]}>
      <View
        style={{
          width: iconSize + 32,
          height: iconSize + 32,
          borderRadius: (iconSize + 32) / 2,
          backgroundColor: COLORS.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SIZES.space.lg,
        }}
      >
        <Icon name={icon} size={iconSize} color={COLORS.contentBrand} />
      </View>

      <Text style={[FONTS.subheading, { textAlign: 'center', marginBottom: message ? 6 : 0 }]}>{title}</Text>

      {message && (
        <Text style={[FONTS.bodySm, { textAlign: 'center', color: COLORS.contentSecondary, marginBottom: actionLabel ? SIZES.space.lg : 0 }]}>
          {message}
        </Text>
      )}

      {actionLabel && onAction && (
        <View style={{ width: '70%', marginTop: SIZES.space.sm }}>
          <AppButton label={actionLabel} onPress={onAction} variant="primary" size="md" />
        </View>
      )}
    </View>
  );
}
