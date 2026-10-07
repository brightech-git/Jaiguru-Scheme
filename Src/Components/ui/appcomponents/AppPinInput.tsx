import { Text, TextInput } from '../../Typography/FontText';
// Src/Components/ui/appcomponents/AppPinInput.tsx
//
// For MPIN entry (4-digit). Unlike AppOTPInput, this drives all dots from
// a single hidden TextInput and re-derives every digit from its value on
// each change — so there's no per-box backspace/onKeyPress logic to get
// wrong in the first place.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, StyleSheet, View, StyleProp, ViewStyle, Pressable, Vibration } from 'react-native';
import theme from '../../../Utills/AppTheme';

const FontAnimatedText = Animated.createAnimatedComponent(Text);

const { COLORS, FONTS, SIZES, ELEVATION } = theme;

export interface AppPinInputRef {
  focus: () => void;
  clear: () => void;
  getValue: () => string;
}

export interface AppPinInputProps {
  length?: number;
  onChangeText?: (pin: string) => void;
  onComplete?: (pin: string) => void;
  error?: boolean;
  success?: boolean;
  disabled?: boolean;
  variant?: 'dots' | 'boxes';
  label?: string;
  hint?: string;
  errorMessage?: string;
  autoFocus?: boolean;
  dotSize?: number;
  gap?: number;
  vibrateOnError?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  /** When false, the actual digit is shown instead of a masked dot/bullet. Defaults to true (masked). */
  secureTextEntry?: boolean;
}

const AppPinInput = forwardRef<AppPinInputRef, AppPinInputProps>(
  (
    {
      length = 4,
      onChangeText,
      onComplete,
      error = false,
      success = false,
      disabled = false,
      variant = 'dots',
      label,
      hint,
      errorMessage,
      autoFocus = false,
      dotSize,
      gap,
      vibrateOnError = true,
      containerStyle,
      secureTextEntry = true,
    },
    ref
  ) => {
    const DOT = dotSize ?? (variant === 'dots' ? 18 : 52);
    const GAP = gap ?? (variant === 'dots' ? 20 : 10);

    const [pin, setPin] = useState<string[]>(Array(length).fill(''));
    const [focused, setFocused] = useState(false);
    const hiddenRef = useRef<TextInput>(null);
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const dotAnims = useRef(Array(length).fill(null).map(() => new Animated.Value(0))).current;

    useEffect(() => {
      if (!error) return;
      if (vibrateOnError) Vibration.vibrate(300);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }, [error, shakeAnim, vibrateOnError]);

    const animateDot = useCallback(
      (index: number, filled: boolean) => {
        Animated.spring(dotAnims[index], { toValue: filled ? 1 : 0, useNativeDriver: true, bounciness: 10, speed: 20 }).start();
      },
      [dotAnims]
    );

    useEffect(() => {
      if (autoFocus) {
        const t = setTimeout(() => hiddenRef.current?.focus(), 300);
        return () => clearTimeout(t);
      }
    }, [autoFocus]);

    const updatePin = useCallback(
      (next: string[]) => {
        setPin(next);
        const str = next.join('');
        onChangeText?.(str);
        if (!next.includes('') && str.length === length) onComplete?.(str);
      },
      [length, onChangeText, onComplete]
    );

    const handleNativeChange = useCallback(
      (text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, length);
        const next = Array(length).fill('');
        digits.split('').forEach((d, i) => {
          next[i] = d;
          animateDot(i, true);
        });
        for (let i = digits.length; i < length; i++) animateDot(i, false);
        updatePin(next);
      },
      [length, animateDot, updatePin]
    );

    useImperativeHandle(ref, () => ({
      focus: () => hiddenRef.current?.focus(),
      clear: () => {
        const next = Array(length).fill('');
        setPin(next);
        dotAnims.forEach((a) => a.setValue(0));
        onChangeText?.('');
      },
      getValue: () => pin.join(''),
    }));

    const dotFillColor = (index: number) => {
      if (error) return COLORS.danger;
      if (success && pin[index]) return COLORS.success;
      if (pin[index]) return COLORS.brand;
      return 'transparent';
    };

    const dotBorderColor = (index: number) => {
      if (error) return COLORS.danger;
      if (success && pin[index]) return COLORS.success;
      if (focused && pin.filter(Boolean).length === index) return COLORS.brand;
      if (pin[index]) return COLORS.brand;
      return COLORS.borderStrong;
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        {hint && <Text style={styles.hint}>{hint}</Text>}

        <Pressable style={styles.tapArea} onPress={() => hiddenRef.current?.focus()}>
          <Animated.View style={[styles.row, { gap: GAP, transform: [{ translateX: shakeAnim }] }]}>
            {pin.map((digit, i) =>
              variant === 'dots' ? (
                <View
                  key={i}
                  style={[styles.dot, { width: DOT, height: DOT, borderRadius: DOT / 2, borderColor: dotBorderColor(i) }]}
                >
                  {secureTextEntry ? (
                    <Animated.View
                      style={[
                        styles.dotInner,
                        {
                          width: DOT - 8,
                          height: DOT - 8,
                          borderRadius: (DOT - 8) / 2,
                          backgroundColor: dotFillColor(i),
                          transform: [{ scale: dotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
                          opacity: dotAnims[i],
                        },
                      ]}
                    />
                  ) : (
                    <FontAnimatedText
                      style={[
                        styles.boxText,
                        { fontSize: DOT * 0.55, color: error ? COLORS.danger : success ? COLORS.success : COLORS.contentPrimary, opacity: dotAnims[i] },
                      ]}
                    >
                      {digit}
                    </FontAnimatedText>
                  )}
                </View>
              ) : (
                <View
                  key={i}
                  style={[
                    styles.box,
                    {
                      width: DOT,
                      height: DOT,
                      borderColor: dotBorderColor(i),
                      backgroundColor: digit ? COLORS.brandSubtle : COLORS.surfaceMuted,
                    },
                  ]}
                >
                  <FontAnimatedText
                    style={[
                      styles.boxText,
                      {
                        color: error ? COLORS.danger : success ? COLORS.success : COLORS.contentPrimary,
                        transform: [{ scale: dotAnims[i] }],
                        opacity: dotAnims[i],
                      },
                    ]}
                  >
                    {digit ? (secureTextEntry ? '●' : digit) : ''}
                  </FontAnimatedText>
                </View>
              )
            )}
          </Animated.View>
        </Pressable>

        <TextInput
          ref={hiddenRef}
          style={styles.hiddenInput}
          value={pin.join('')}
          onChangeText={handleNativeChange}
          keyboardType="number-pad"
          maxLength={length}
          editable={!disabled}
          caretHidden
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {error && errorMessage && <Text style={styles.errorMsg}>{errorMessage}</Text>}
      </View>
    );
  }
);

AppPinInput.displayName = 'AppPinInput';
export default AppPinInput;

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  label: { ...FONTS.label, color: COLORS.contentPrimary, marginBottom: 4 },
  hint: { ...FONTS.bodySm, color: COLORS.contentSecondary, marginBottom: 16, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: COLORS.surfaceMuted },
  dotInner: {},
  box: {
    borderRadius: SIZES.radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...ELEVATION.raised,
  },
  boxText: { ...FONTS.heading, color: COLORS.contentPrimary },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  errorMsg: { ...FONTS.caption, color: COLORS.danger, marginTop: 10, textAlign: 'center' },
  tapArea: { padding: 12 },
});
