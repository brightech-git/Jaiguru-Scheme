import { Text } from '../../Typography/FontText';
// Src/Components/ui/appcomponents/AppLoader.tsx
import React from 'react';
import { View, ActivityIndicator, Modal, StyleProp, ViewStyle } from 'react-native';
import theme from '../../../Utills/AppTheme';

const { COLORS, SIZES, FONTS } = theme;

export interface AppLoaderProps {
  visible?: boolean;
  fullScreen?: boolean;
  overlay?: boolean;
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export default function AppLoader({
  visible = true,
  fullScreen = false,
  overlay = false,
  message,
  size = 'large',
  color = COLORS.contentBrand,
  style,
}: AppLoaderProps) {
  if (!visible) return null;

  const content = (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={[FONTS.bodySm, { marginTop: SIZES.space.sm, color: COLORS.contentSecondary }]}>{message}</Text>}
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={{ flex: 1, backgroundColor: COLORS.scrim, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: SIZES.radius.lg,
              padding: SIZES.space.xl,
              alignItems: 'center',
              minWidth: 120,
            }}
          >
            <ActivityIndicator size={size} color={color} />
            {message && (
              <Text style={[FONTS.bodySm, { marginTop: SIZES.space.sm, color: COLORS.contentSecondary, textAlign: 'center' }]}>
                {message}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  if (fullScreen) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfacePage }}>{content}</View>;
  }

  return content;
}
