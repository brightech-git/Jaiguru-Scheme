import { TextInput, Text } from '../../Typography/FontText';
// Src/Components/ui/appcomponents/AppInput.tsx
import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import theme from '../../../Utills/AppTheme';

const { COLORS, FONTS, SIZES, moderateScale } = theme;

export interface AppInputRef {
  shake: () => void;
  focus: () => void;
}

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  required?: boolean;
  size?: 'sm' | 'md';
  shakeOnError?: boolean;
}

const AppInput = forwardRef<AppInputRef, AppInputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      isPassword = false,
      containerStyle,
      required = false,
      size = 'md',
      shakeOnError = false,
      ...rest
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const borderAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const inputRef = useRef<TextInput>(null);

    const triggerShake = () => {
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 45, useNativeDriver: true }),
      ]).start();
    };

    useImperativeHandle(ref, () => ({
      shake: triggerShake,
      focus: () => inputRef.current?.focus(),
    }));

    useEffect(() => {
      if (shakeOnError && error) triggerShake();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error]);

    const onFocus: TextInputProps['onFocus'] = (e) => {
      setFocused(true);
      Animated.spring(borderAnim, { toValue: 1, useNativeDriver: false, speed: 30 }).start();
      rest.onFocus?.(e);
    };

    const onBlur: TextInputProps['onBlur'] = (e) => {
      setFocused(false);
      Animated.spring(borderAnim, { toValue: 0, useNativeDriver: false, speed: 30 }).start();
      rest.onBlur?.(e);
    };

    const borderColor = borderAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [error ? COLORS.danger : COLORS.border, error ? COLORS.danger : COLORS.brand],
    });

    const hasError = !!error;
    const iSize = moderateScale(18);

    return (
      <Animated.View style={[styles.wrapper, containerStyle, { transform: [{ translateX: shakeAnim }] }]}>
        {label && (
          <Text
            style={[
              styles.label,
              {
                fontFamily: FONTS.family.medium,
                fontSize: SIZES.text.sm,
                color: hasError ? COLORS.danger : focused ? COLORS.brand : COLORS.contentSecondary,
              },
            ]}
          >
            {label}
            {required && <Text style={{ color: COLORS.danger }}> *</Text>}
          </Text>
        )}

        <Animated.View
          style={[
            styles.inputRow,
            {
              borderColor,
              borderWidth: focused ? 1.5 : 1,
              backgroundColor: focused ? COLORS.surface : COLORS.fieldBackground,
              minHeight: size === 'sm' ? moderateScale(42) : moderateScale(50),
            },
          ]}
        >
          {leftIcon && (
            <Icon
              name={leftIcon}
              size={iSize}
              color={hasError ? COLORS.danger : focused ? COLORS.brand : COLORS.contentMuted}
              style={styles.leftIcon}
            />
          )}

          <TextInput
            ref={inputRef}
            {...rest}
            secureTextEntry={isPassword && !showPass}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholderTextColor={COLORS.contentPlaceholder}
            style={[
              styles.input,
              { fontFamily: FONTS.family.regular, fontSize: SIZES.text.md, color: COLORS.contentPrimary },
              rest.style,
            ]}
          />

          {isPassword ? (
            <TouchableOpacity onPress={() => setShowPass((p) => !p)} style={styles.rightIcon}>
              <Icon name={showPass ? 'eye-off-outline' : 'eye-outline'} size={iSize} color={COLORS.contentMuted} />
            </TouchableOpacity>
          ) : rightIcon ? (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
              <Icon name={rightIcon} size={iSize} color={focused ? COLORS.brand : COLORS.contentMuted} />
            </TouchableOpacity>
          ) : null}
        </Animated.View>

        {hasError ? (
          <View style={styles.helperRow}>
            <Icon name="alert-circle-outline" size={12} color={COLORS.danger} />
            <Text style={[styles.helperText, { color: COLORS.danger, fontFamily: FONTS.family.regular, fontSize: SIZES.text.xxs }]}>
              {'  '}
              {error}
            </Text>
          </View>
        ) : hint ? (
          <Text
            style={[
              styles.helperText,
              { color: COLORS.contentMuted, fontFamily: FONTS.family.regular, fontSize: SIZES.text.xxs, marginTop: 4 },
            ]}
          >
            {hint}
          </Text>
        ) : null}
      </Animated.View>
    );
  }
);

AppInput.displayName = 'AppInput';
export default AppInput;

const styles = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  label: { marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radius.field,
    paddingHorizontal: SIZES.space.md,
  },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 8, padding: 4 },
  input: { flex: 1, paddingVertical: 0 },
  helperRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  helperText: {},
});
