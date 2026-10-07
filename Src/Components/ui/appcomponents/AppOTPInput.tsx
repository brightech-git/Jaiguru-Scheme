import { Text, TextInput } from '../../Typography/FontText';
// Src/Components/ui/appcomponents/AppOTPInput.tsx
//
// Reusable OTP box row. Consolidates the backspace-handling fix applied
// across VerifyOTP.js, VerifyMpinOTP.js, VerifyMpin.js, ResetMpin.js,
// GoogleContactVerify.js and ForgotVerifyOTP.js: onKeyPress (not
// onChangeText) is the single source of truth for clearing + moving focus
// back, since onChangeText isn't guaranteed to fire with an empty value
// when deleting the last character of a maxLength={1} field on every
// Android keyboard.
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Animated, NativeSyntheticEvent, Platform, StyleSheet, TextInputKeyPressEventData, View, StyleProp, ViewStyle, Pressable } from 'react-native';
import theme from '../../../Utills/AppTheme';

const { COLORS, FONTS, SIZES, ELEVATION } = theme;

export interface AppOTPInputRef {
  focus: () => void;
  clear: () => void;
  getValue: () => string;
}

export interface AppOTPInputProps {
  length?: number;
  value?: string;
  onChangeText?: (otp: string) => void;
  onComplete?: (otp: string) => void;
  error?: boolean;
  errorMessage?: string;
  success?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  label?: string;
  hint?: string;
  boxSize?: number;
  gap?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

const AppOTPInput = forwardRef<AppOTPInputRef, AppOTPInputProps>(
  (
    {
      length = 6,
      value: controlledValue,
      onChangeText,
      onComplete,
      error = false,
      errorMessage,
      success = false,
      autoFocus = false,
      disabled = false,
      label,
      hint,
      boxSize,
      gap,
      containerStyle,
    },
    ref
  ) => {
    const BOX_SIZE = boxSize ?? Math.min(48, Math.floor(300 / length) - 8);
    const BOX_GAP = gap ?? 8;

    const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const inputRefs = useRef<(TextInput | null)[]>(Array(length).fill(null));
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (controlledValue !== undefined) {
        const chars = controlledValue.slice(0, length).split('');
        setOtp([...chars, ...Array(length - chars.length).fill('')]);
      }
    }, [controlledValue, length]);

    useEffect(() => {
      if (autoFocus) {
        const t = setTimeout(() => inputRefs.current[0]?.focus(), 300);
        return () => clearTimeout(t);
      }
    }, [autoFocus]);

    useEffect(() => {
      if (!error) return;
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }, [error, shakeAnim]);

    const focusBox = useCallback(
      (index: number) => {
        const clamped = Math.min(Math.max(index, 0), length - 1);
        inputRefs.current[clamped]?.focus();
      },
      [length]
    );

    const handleChange = useCallback(
      (text: string, index: number) => {
        // Paste
        if (text.length > 1) {
          const digits = text.replace(/\D/g, '').slice(0, length);
          const next = Array(length).fill('');
          digits.split('').forEach((d, i) => {
            next[i] = d;
          });
          setOtp(next);
          const fullOtp = next.join('');
          onChangeText?.(fullOtp);
          if (digits.length === length) {
            onComplete?.(fullOtp);
            inputRefs.current[length - 1]?.blur();
          } else {
            focusBox(digits.length);
          }
          return;
        }

        const digit = text.slice(-1);
        const next = [...otp];
        next[index] = digit;
        setOtp(next);

        const fullOtp = next.join('');
        onChangeText?.(fullOtp);

        if (digit && index < length - 1) focusBox(index + 1);
        if (fullOtp.length === length && !next.includes('')) onComplete?.(fullOtp);
      },
      [otp, length, focusBox, onChangeText, onComplete]
    );

    // Single source of truth for backspace: clears + moves focus back in
    // one press instead of requiring two.
    const handleKeyPress = useCallback(
      (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
        if (e.nativeEvent.key !== 'Backspace' || index === 0) return;

        const next = [...otp];
        if (otp[index]) {
          next[index] = '';
        } else {
          next[index - 1] = '';
        }
        setOtp(next);
        onChangeText?.(next.join(''));
        focusBox(index - 1);
      },
      [otp, focusBox, onChangeText]
    );

    useImperativeHandle(ref, () => ({
      focus: () => {
        const first = otp.findIndex((d) => d === '');
        focusBox(first === -1 ? 0 : first);
      },
      clear: () => {
        setOtp(Array(length).fill(''));
        onChangeText?.('');
        focusBox(0);
      },
      getValue: () => otp.join(''),
    }));

    const boxColor = (index: number) => {
      if (disabled) return COLORS.surfaceSunken;
      if (error) return COLORS.danger + '22';
      if (success && otp[index]) return COLORS.success + '22';
      if (otp[index] || focusedIndex === index) return COLORS.brandSubtle;
      return COLORS.surfaceSunken;
    };

    const boxBorderColor = (index: number) => {
      if (error) return COLORS.danger;
      if (success && otp[index]) return COLORS.success;
      if (focusedIndex === index || otp[index]) return COLORS.brand;
      return COLORS.borderStrong;
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        {hint && <Text style={styles.hint}>{hint}</Text>}

        <Animated.View style={[styles.row, { gap: BOX_GAP, transform: [{ translateX: shakeAnim }] }]}>
          {Array(length)
            .fill(null)
            .map((_, i) => {
              const hasValue = !!otp[i];
              return (
                <Pressable key={i} onPress={() => focusBox(i)}>
                  <View
                    style={[
                      styles.box,
                      { width: BOX_SIZE, height: BOX_SIZE, backgroundColor: boxColor(i), borderColor: boxBorderColor(i) },
                    ]}
                  >
                    <TextInput
                      ref={(r) => {
                        inputRefs.current[i] = r;
                      }}
                      style={styles.hiddenInput}
                      value={otp[i]}
                      onChangeText={(t) => handleChange(t, i)}
                      onKeyPress={(e) => handleKeyPress(e, i)}
                      onFocus={() => setFocusedIndex(i)}
                      onBlur={() => setFocusedIndex(-1)}
                      keyboardType="number-pad"
                      maxLength={length}
                      editable={!disabled}
                      caretHidden
                      selectTextOnFocus
                      textContentType="oneTimeCode"
                      autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                    />
                    {hasValue && (
                      <Text style={[styles.digit, { color: error ? COLORS.danger : success ? COLORS.success : COLORS.contentPrimary }]}>
                        {otp[i]}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
        </Animated.View>

        {error && errorMessage && <Text style={styles.errorMsg}>{errorMessage}</Text>}
      </View>
    );
  }
);

AppOTPInput.displayName = 'AppOTPInput';
export default AppOTPInput;

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  label: { ...FONTS.label, color: COLORS.contentPrimary, marginBottom: 4 },
  hint: { ...FONTS.bodySm, color: COLORS.contentSecondary, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  box: {
    borderRadius: SIZES.radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...ELEVATION.raised,
  },
  hiddenInput: { position: 'absolute', width: '100%', height: '100%', opacity: 0 },
  digit: { ...FONTS.heading, textAlign: 'center' },
  errorMsg: { ...FONTS.caption, color: COLORS.danger, marginTop: 8, textAlign: 'center' },
});
