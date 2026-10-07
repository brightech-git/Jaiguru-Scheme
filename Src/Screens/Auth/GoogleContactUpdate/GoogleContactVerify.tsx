import { Text } from '../../../Components/Typography/FontText';
// Src/Screens/Auth/GoogleContactUpdate/GoogleContactVerify.tsx
// -----------------------------------------------------------------------------
// Verifies the OTP sent to a Google user's new mobile number, then persists the
// session and continues to MPIN. Premium champagne-gold design matching Login.
// All auth logic (verifyGoogleOtp / requestGoogleOtp / saveAuthData) preserved.
// -----------------------------------------------------------------------------

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getHash, useOtpVerify, removeListener } from '../../../Utills/otpVerifyShim';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import useAuth from '../../../api/hooks/Auth/useAuth';
import theme from '../../../Utills/AppTheme';
import { saveAuthData } from '../../../Utills/AsynchStorageHelper';
import { AppOTPInput } from '../../../Components/ui/appcomponents';
import CommonHeader from '../../../Components/CommonHeader/CommonHeader';
import LoginButton from '../Login/components/LoginButton';
import GoldParticles from '../Login/components/GoldParticles';

const { COLORS, SIZES, FONTS, ELEVATION } = theme;
const { width, height } = Dimensions.get('window');

const BG_GRADIENT = COLORS.gradient.accentWash as [string, string, string];
const MEDALLION_GRADIENT = COLORS.gradient.brand as [string, string, string];
const MEDALLION = SIZES.icon.avatarLg + SIZES.space.lg;
const RESEND_SECONDS = 30;

interface Props {
  route: { params: { userId?: string; mobile: string } };
  navigation: any;
}

const GoogleContactOtpScreen = ({ route, navigation }: Props) => {
  const { userId, mobile } = route.params;
  const { verifyGoogleOtp, requestGoogleOtp, loading, error } = useAuth();

  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  // Auto SMS OTP capture (Android). Reads the OTP from the incoming SMS that
  // matches the app hash so the user doesn't have to type it.
  const { message, startListener, stopListener } = useOtpVerify({ numberOfDigits: 6 });
  // Prevents double submission when auto-detect + onComplete fire together.
  const submittingRef = useRef(false);

  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
  }, [enter]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: interpolate(enter.value, [0, 1], [28, 0]) }],
  }));

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer((t) => Math.max(t - 1, 0)), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Core verification — accepts the code directly so auto-detect can submit
  // without waiting for a state update. Guarded against concurrent calls.
  const submitOtp = useCallback(
    async (code: string) => {
      if (code.length < 6 || submittingRef.current || loading) return;
      submittingRef.current = true;

      try {
        const result: any = await verifyGoogleOtp({ newContactNumber: mobile, otp: code, userId });
        console.log('OTP Verify Result:', result);

        if (result && !result.error) {
          const saveResult = await saveAuthData(result);
          if (saveResult.success) {
            Alert.alert('Success', 'Mobile number verified successfully!', [
              { text: 'Continue', onPress: () => navigation.replace('MpinVerify') },
            ]);
          } else {
            Alert.alert('Storage Error', saveResult.error ?? 'Could not save session');
          }
        }
      } finally {
        submittingRef.current = false;
      }
    },
    [loading, mobile, userId, verifyGoogleOtp, navigation],
  );

  const handleVerifyOtp = () => {
    if (otp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP');
      return;
    }
    submitOtp(otp);
  };

  // ---- Start the SMS retriever on mount (Android only) ----------------------
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let active = true;

    (async () => {
      try {
        await getHash(); // app hash the SMS must contain to be auto-read
        if (active) startListener?.();
      } catch (err) {
        console.log('OTP auto-detect unavailable:', err);
      }
    })();

    return () => {
      active = false;
      try {
        removeListener();
        stopListener?.();
      } catch {
        /* noop */
      }
    };
  }, [startListener, stopListener]);

  // ---- Parse the captured SMS, fill the boxes, and auto-verify --------------
  useEffect(() => {
    if (!message) return;
    const match = /(\d{6})/.exec(message);
    if (match?.[1]) {
      const detected = match[1];
      setOtp(detected);
      submitOtp(detected);
    }
  }, [message, submitOtp]);

  const handleResend = async () => {
    if (!canResend) return;
    const result: any = await requestGoogleOtp({ userId: userId ?? '', newContactNumber: mobile });
    if (!result?.error) {
      setOtp('');
      setTimer(RESEND_SECONDS);
      setCanResend(false);
      submittingRef.current = false;
      try {
        startListener?.(); // listen again for the new code
      } catch {
        /* noop */
      }
      Alert.alert('OTP Resent', `A new verification code has been sent to ${mobile}`);
    }
  };

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
        <GoldParticles width={width} height={height} />
      </View>

      <CommonHeader title="Verify OTP" transparent borderBottom={false} shadow={false} />

      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <Animated.View style={contentStyle}>
              <View style={styles.medallionWrap}>
                <LinearGradient colors={MEDALLION_GRADIENT} style={styles.medallion} start={{ x: 0.1, y: 0.1 }} end={{ x: 0.9, y: 0.9 }}>
                  <View style={styles.medallionInner}>
                    <MaterialCommunityIcons name="shield-lock" size={SIZES.icon.xxl} color={COLORS.contentBrand} />
                  </View>
                </LinearGradient>
              </View>

              <Text style={styles.title}>Enter Verification Code</Text>
              <Text style={styles.subtitle}>We&apos;ve sent a 6-digit code to</Text>
              <View style={styles.phoneChip}>
                <MaterialCommunityIcons name="cellphone" size={SIZES.icon.xs} color={COLORS.contentBrand} />
                <Text style={styles.phoneNumber}>{mobile}</Text>
              </View>

              <View style={styles.otpContainer}>
                <AppOTPInput
                  length={6}
                  value={otp}
                  onChangeText={setOtp}
                  onComplete={submitOtp}
                  error={!!error}
                  errorMessage={error || undefined}
                  autoFocus
                />
              </View>

              <LoginButton
                label="Verify & Continue"
                onPress={handleVerifyOtp}
                loading={loading}
                disabled={loading || otp.length < 6}
                icon="check-decagram"
              />

              <View style={styles.resendRow}>
                {canResend ? (
                  <Pressable onPress={handleResend} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.resendLink}>Resend Code</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.resendMuted}>
                    Resend code in 0:{timer.toString().padStart(2, '0')}
                  </Text>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default GoogleContactOtpScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surfacePage },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SIZES.space.gutter,
    paddingTop: SIZES.space.xxxl,
    paddingBottom: SIZES.space.xxxl,
  },
  medallionWrap: {
    alignSelf: 'center',
    borderRadius: MEDALLION / 2,
    ...ELEVATION.brandGlow,
    shadowColor: COLORS.shadowBrand,
    marginBottom: SIZES.space.xxl,
  },
  medallion: {
    width: MEDALLION,
    height: MEDALLION,
    borderRadius: MEDALLION / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionInner: {
    width: MEDALLION - SIZES.space.lg,
    height: MEDALLION - SIZES.space.lg,
    borderRadius: (MEDALLION - SIZES.space.lg) / 2,
    backgroundColor: COLORS.whiteAlpha80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.display3,
    color: COLORS.contentPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.md,
    color: COLORS.contentSecondary,
    textAlign: 'center',
    marginTop: SIZES.space.sm,
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.brandAlpha16,
    paddingVertical: SIZES.space.xs,
    paddingHorizontal: SIZES.space.lg,
    borderRadius: SIZES.radius.pill,
    marginTop: SIZES.space.sm,
    marginBottom: SIZES.space.xxxl,
  },
  phoneNumber: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.md,
    color: COLORS.contentPrimary,
    marginLeft: SIZES.space.xs,
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: SIZES.space.xxxl,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: SIZES.space.xxl,
  },
  resendLink: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.md,
    color: COLORS.contentBrand,
  },
  resendMuted: {
    fontFamily: FONTS.family.medium,
    fontSize: SIZES.text.md,
    color: COLORS.contentSecondary,
  },
});
