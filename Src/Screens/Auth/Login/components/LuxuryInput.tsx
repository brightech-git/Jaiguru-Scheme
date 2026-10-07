import { Text, TextInput } from '../../../../Components/Typography/FontText';
// Src/Screens/Auth/Login/components/LuxuryInput.tsx
// -----------------------------------------------------------------------------
// Reusable premium text field with an animated focus glow (border + soft gold
// shadow), a leading icon, an optional trailing action (e.g. show/hide), and an
// inline error message. Uses the global AppTheme.
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import theme from '../../../../Utills/AppTheme';

const { COLORS, SIZES, FONTS } = theme;
type MCName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface LuxuryInputProps extends Omit<TextInputProps, 'style'> {
  icon: MCName;
  error?: string;
  /** Trailing icon button (e.g. eye / eye-off). */
  trailingIcon?: MCName;
  onTrailingPress?: () => void;
  trailingAccessibilityLabel?: string;
}

const LuxuryInput: React.FC<LuxuryInputProps> = ({
  icon,
  error,
  trailingIcon,
  onTrailingPress,
  trailingAccessibilityLabel,
  onFocus,
  onBlur,
  ...inputProps
}) => {
  const focus = useSharedValue(0);
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: hasError
      ? COLORS.danger
      : interpolateColor(focus.value, [0, 1], [COLORS.border, COLORS.brand]),
    shadowOpacity: 0.18 * focus.value,
    shadowRadius: 10 * focus.value,
    elevation: hasError ? 0 : 4 * focus.value,
  }));

  return (
    <View style={styles.field}>
      <Animated.View style={[styles.inputRow, containerStyle]}>
        <MaterialCommunityIcons
          name={icon}
          size={SIZES.icon.md}
          color={focused && !hasError ? COLORS.brand : COLORS.contentMuted}
          style={styles.leadingIcon}
        />
        <TextInput
          {...inputProps}
          placeholderTextColor={COLORS.contentSecondary}
          style={styles.input}
          onFocus={(e) => {
            setFocused(true);
            focus.value = withTiming(1, { duration: 180 });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            focus.value = withTiming(0, { duration: 180 });
            onBlur?.(e);
          }}
        />
        {trailingIcon && (
          <Pressable
            onPress={onTrailingPress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={trailingAccessibilityLabel}
            style={styles.trailingBtn}
          >
            <MaterialCommunityIcons name={trailingIcon} size={SIZES.icon.md} color={focused ? COLORS.brand : COLORS.contentMuted} />
          </Pressable>
        )}
      </Animated.View>

      {hasError && (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle-outline" size={SIZES.icon.xs} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    marginBottom: SIZES.space.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: SIZES.field.height,
    borderRadius: SIZES.radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: SIZES.space.lg,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadowBrand,
    shadowOffset: { width: 0, height: 4 },
  },
  leadingIcon: {
    marginRight: SIZES.space.sm,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.family.medium,
    fontSize: SIZES.text.lg,
    color: COLORS.contentPrimary,
    paddingVertical: 0,
  },
  trailingBtn: {
    paddingLeft: SIZES.space.sm,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.space.xs,
    marginLeft: SIZES.space.xs,
  },
  errorText: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.sm,
    color: COLORS.danger,
    marginLeft: SIZES.space.xs,
  },
});

export default React.memo(LuxuryInput);
