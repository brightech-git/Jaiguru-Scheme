import ApiImage from '../../../Components/ApiImage';
import { Text } from '../../../Components/Typography/FontText';
// Src/Screens/Home/components/ProfileAvatar.tsx
// -----------------------------------------------------------------------------
// Circular profile avatar with a gold ring. Shows the image if provided, else
// the customer's initials. Scales in on mount and dips on press.
// -----------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import theme from '../../../Utills/AppTheme';
import { getInitials } from './homeHeaderData';

const { COLORS, SIZES, FONTS, ELEVATION } = theme;
const RING = COLORS.gradient.brand as [string, string, string];

export interface ProfileAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  onPress?: () => void;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ name, imageUrl, size = 52, onPress }) => {
  const enter = useSharedValue(0);
  const pressed = useSharedValue(0);

  useEffect(() => {
    enter.value = withTiming(1, { duration: 500 });
  }, [enter]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: withSpring(pressed.value ? 0.92 : 0.7 + 0.3 * enter.value, { damping: 12, stiffness: 200 }) }],
  }));

  const inner = size - 6;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (pressed.value = 1)}
        onPressOut={() => (pressed.value = 0)}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        style={[styles.shadow, { borderRadius: size / 2 }]}
      >
        <LinearGradient colors={RING} style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
          {imageUrl ? (
            <ApiImage source={{ uri: imageUrl }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
          ) : (
            <View style={[styles.initialsWrap, { width: inner, height: inner, borderRadius: inner / 2 }]}>
              <Text style={styles.initials}>{getInitials(name)}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shadow: { ...ELEVATION.brandGlow, shadowColor: COLORS.shadowBrand },
  ring: { alignItems: 'center', justifyContent: 'center' },
  initialsWrap: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.lg,
    color: COLORS.contentBrand,
    letterSpacing: 0.5,
  },
});

export default React.memo(ProfileAvatar);
