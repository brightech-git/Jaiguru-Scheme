import { Text } from '../../../Components/Typography/FontText';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dimensions, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getHash, useOtpVerify, removeListener } from '../../../Utills/otpVerifyShim';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useToast } from '../../../Components/Toast/Toast';
import { AppOTPInput, AppOTPInputRef } from '../../../Components/ui/appcomponents';
import CommonHeader from '../../../Components/CommonHeader/CommonHeader';
import LoginButton from '../Login/components/LoginButton';
import GoldParticles from '../Login/components/GoldParticles';

const { COLORS, SIZES, FONTS, ELEVATION } = theme;
const { width, height } = Dimensions.get('window');

const BG_GRADIENT = COLORS.gradient.accentWash as [string, string, string];
const MEDALLION_GRADIENT = COLORS.gradient.brand as [string, string, string];
const MEDALLION = SIZES.icon.avatarLg + SIZES.space.lg;
const RESEND_SECONDS = 30;

const VerifyOTPScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { verifyNormalOtp, verifyGoogleOtp, loading, error, clearError } = useAuth();
  const { showToast, Toast } = useToast();

  const { mobileNumber, email, username, otpType = 'normal', googleData, registrationData } = route.params || {};

  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const submittingRef = useRef(false);
  const otpRef = useRef<AppOTPInputRef>(null);

  const { message, startListener, stopListener } = useOtpVerify({ numberOfDigits: 6 });

  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
  }, [enter]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: interpolate(enter.value, [0, 1], [28, 0]) }],
  }));

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const interval = setInterval(() => setTimer((t) => Math.max(t - 1, 0)), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // SMS listener (Android)
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let active = true;
    (async () => {
      try {
        await getHash();
        if (active) startListener?.();
      } catch (err) {
        console.log('OTP auto-detect unavailable:', err);
      }
    })();
    return () => {
      active = false;
      try { removeListener(); stopListener?.(); } catch { /* noop */ }
    };
  }, [startListener, stopListener]);

  const navigateAfterOtp = useCallback(async (result?: any) => {
    if (otpType === 'normal') {
      navigation.replace('RegisterInfo', {
        userId: result?.id || result?.userId,
        contactNumber: mobileNumber,
      });
      return;
    }
    try {
      const hasMpin = await AsyncStorage.getItem('hasMpin');
      if (hasMpin === 'true') navigation.replace('MpinVerify');
      else navigation.replace('MpinCreate');
    } catch {
      navigation.replace('MpinCreate');
    }
  }, [navigation, otpType, mobileNumber]);

  const submitOtp = useCallback(
    async (code: string) => {
      if (code.length < 6 || submittingRef.current || loading) return;
      submittingRef.current = true;
      Keyboard.dismiss();
      clearError();

      try {
        let result: any;

        if (otpType === 'normal') {
          result = await verifyNormalOtp({
            username: username || registrationData?.username,
            email: email || registrationData?.email,
            contactNumber: mobileNumber || registrationData?.contactNumber,
            otp: code.trim(),
          });
        } else if (otpType === 'google') {
          result = await verifyGoogleOtp({
            newContactNumber: mobileNumber || googleData?.contactNumber,
            otp: code.trim(),
          });
          if (googleData && result) {
            result = { ...googleData, ...result, contactNumber: mobileNumber || googleData?.contactNumber };
          }
        }

        if (!result || (!result.token && !result.id)) {
          throw new Error(result?.errorMessage || 'Verification failed. Please try again.');
        }

        const saveResult = await saveAuthData(result);
        if (!saveResult.success) throw new Error(saveResult.error || 'Failed to save session');

        showToast({ message: 'OTP verified successfully!', type: 'success', duration: 2000 });
        stopListener?.();
        setTimeout(() => navigateAfterOtp(result), 600);
      } catch (err: any) {
        showToast({ message: err.message || 'Invalid OTP. Please try again.', type: 'error', duration: 3000 });
        setOtp('');
        otpRef.current?.clear();
      } finally {
        submittingRef.current = false;
      }
    },
    [loading, otpType, mobileNumber, email, username, googleData, registrationData,
      verifyNormalOtp, verifyGoogleOtp, clearError, showToast, stopListener, navigateAfterOtp],
  );

  // Auto-detect OTP from SMS
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
    setOtp('');
    otpRef.current?.clear();
    setTimer(RESEND_SECONDS);
    setCanResend(false);
    submittingRef.current = false;
    try { startListener?.(); } catch { /* noop */ }
    showToast({ message: 'OTP resent successfully!', type: 'success', duration: 2000 });
  };

  const displayNumber = mobileNumber ? `+91 ${mobileNumber}` : email ?? '';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
        <GoldParticles width={width} height={height} />
      </View>

      <CommonHeader title="Verify OTP" transparent borderBottom={false} shadow={false} />

      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <Animated.View style={contentStyle}>
              {/* Medallion */}
              <View style={styles.medallionWrap}>
                <LinearGradient
                  colors={MEDALLION_GRADIENT}
                  style={styles.medallion}
                  start={{ x: 0.1, y: 0.1 }}
                  end={{ x: 0.9, y: 0.9 }}
                >
                  <View style={styles.medallionInner}>
                    <MaterialCommunityIcons name="shield-lock" size={SIZES.icon.xxl} color={COLORS.contentBrand} />
                  </View>
                </LinearGradient>
              </View>

              <Text style={styles.title}>Enter Verification Code</Text>
              <Text style={styles.subtitle}>We've sent a 6-digit code to</Text>

              <View style={styles.phoneChip}>
                <MaterialCommunityIcons
                  name={mobileNumber ? 'cellphone' : 'email-outline'}
                  size={SIZES.icon.xs}
                  color={COLORS.contentBrand}
                />
                <Text style={styles.phoneNumber}>{displayNumber}</Text>
              </View>

              {/* OTP Input */}
              <View style={styles.otpContainer}>
                <AppOTPInput
                  ref={otpRef}
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
                onPress={() => submitOtp(otp)}
                loading={loading}
                disabled={loading || otp.length < 6}
                icon="check-decagram"
              />

              {/* Resend */}
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

              {/* Back */}
              <Pressable
                onPress={() => navigation.goBack()}
                style={styles.backRow}
                hitSlop={8}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="pencil-outline" size={SIZES.icon.xs} color={COLORS.contentSecondary} />
                <Text style={styles.backText}>Wrong number? Change it</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Toast />
    </View>
  );
};

export default VerifyOTPScreen;

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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.space.xxl,
    gap: SIZES.space.xs,
  },
  backText: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.sm,
    color: COLORS.contentSecondary,
  },
});
