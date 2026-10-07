import { Text } from '../../Typography/FontText';
// Src/Components/ui/appcomponents/AppProgressBar.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleProp, ViewStyle } from 'react-native';
import theme from '../../../Utills/AppTheme';

const { COLORS, SIZES, FONTS } = theme;

export interface AppProgressBarProps {
  /** 0-100 */
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function AppProgressBar({
  progress,
  color = COLORS.contentBrand,
  trackColor = COLORS.border,
  height = 8,
  label,
  showPercentage = false,
  animated = true,
  style,
}: AppProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  const widthAnim = useRef(new Animated.Value(animated ? 0 : clamped)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(widthAnim, { toValue: clamped, duration: 500, useNativeDriver: false }).start();
    } else {
      widthAnim.setValue(clamped);
    }
  }, [clamped, animated, widthAnim]);

  return (
    <View style={style}>
      {(label || showPercentage) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SIZES.space.xs }}>
          {label ? <Text style={FONTS.bodySm}>{label}</Text> : <View />}
          {showPercentage ? <Text style={[FONTS.label, { color }]}>{Math.round(clamped)}%</Text> : null}
        </View>
      )}
      <View style={{ height, backgroundColor: trackColor, borderRadius: SIZES.radius.pill, overflow: 'hidden' }}>
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: color,
            borderRadius: SIZES.radius.pill,
            width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          }}
        />
      </View>
    </View>
  );
}
