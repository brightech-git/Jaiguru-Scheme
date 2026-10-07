import { Text } from '../../../Components/Typography/FontText';
// Src/Screens/Auth/ForgotMpin/VerifyMpinOTP.tsx
// -----------------------------------------------------------------------------
// Premium Forgot-MPIN OTP + reset screen (champagne theme). Two steps:
//   1) OTP  — auto-captured via SMS retriever (Android) or entered manually
//   2) MPIN — set + confirm a new 4-digit MPIN (verifyForgotOtp does both)
// All logic preserved; UI reskinned via MpinScaffold + gold PIN/OTP inputs.
// -----------------------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getHash, useOtpVerify, removeListener } from '../../../Utills/otpVerifyShim';

import { useMpin } from '../../../api/hooks/Mpin/useMpin';
import theme from '../../../Utills/AppTheme';
import { ToastTypes, ToastPositions, ToastAnimationTypes, useToast } from '../../../Components/Toast/Toast';
import { getUserData } from '../../../Utills/AsynchStorageHelper';
import {
  AppOTPInput,
  AppOTPInputRef,
  AppPinInput,
  AppPinInputRef,
} from '../../../Components/ui/appcomponents';
import MpinScaffold from '../Mpin/MpinScaffold';
import LoginButton from '../Login/components/LoginButton';

const { COLORS, SIZES, FONTS } = theme;

type Step = 'otp' | 'mpin';

const VerifyForgotMpinScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { verifyForgotOtp, sendForgotOtp, loading } = useMpin();
  const { showToast, Toast } = useToast();

  const { mobileNumber: routeMobile } = route.params || {};

  const [otp, setOtp] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [timer, setTimer] = useState(60);
  const [userMobile, setUserMobile] = useState('');
  const [step, setStep] = useState<Step>('otp');

  const [waitingForOtp, setWaitingForOtp] = useState(Platform.OS === 'android');
  const [autoVerifyTimer, setAutoVerifyTimer] = useState(30);
  const [smsListenerReady, setSmsListenerReady] = useState(false);

  const toastShownRef = useRef<Record<string, number | boolean>>({ waiting: false, timeout: false, autoDetect: false, manual: false });
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const otpRef = useRef<AppOTPInputRef>(null);
  const newMpinRef = useRef<AppPinInputRef>(null);
  const confirmMpinRef = useRef<AppPinInputRef>(null);

  const { message, timeoutError, startListener, stopListener } = useOtpVerify({ numberOfDigits: 6 });

  useEffect(() => {
    loadUserMobile();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const loadUserMobile = async () => {
    try {
      const userData: any = await getUserData();
      if (userData) {
        const mobile = userData.contactNumber || userData.mobileNumber || userData.phone || userData.mobile;
        setUserMobile(mobile || routeMobile || '');
      }
    } catch (error) {
      console.error('Error loading user mobile:', error);
    }
  };

  const formatMobileNumber = (number: string) => {
    if (!number) return 'your registered number';
    const strNumber = String(number);
    if (strNumber.length >= 10) return `•••• •••• ${strNumber.slice(-4)}`;
    if (strNumber.length >= 4) return `••••${strNumber.slice(-4)}`;
    return 'your registered number';
  };

  const safeShowToast = (params: any) => {
    const toastKey = params.message.substring(0, 20);
    const now = Date.now();
    if (toastShownRef.current[toastKey] && now - (toastShownRef.current[toastKey] as number) < 3000) return;
    toastShownRef.current[toastKey] = now;
    showToast(params);
  };

  const detectOtpFromMessage = (smsMessage: string | null) => {
    if (!smsMessage) return null;
    const patterns = [
      /your\s+otp\s+(?:for\s+\w+\s+)?is\s*[:\-]?\s*(\d{6})/i,
      /otp.*?is\s*[:\-]?\s*(\d{6})/i,
      /otp[:\s]+(\d{6})/i,
      /verification\s+code.*?(\d{6})/i,
      /\b(\d{6})\b/,
    ];
    for (const pattern of patterns) {
      const match = smsMessage.match(pattern);
      if (match) return match[1] || match[0];
    }
    return null;
  };

  useEffect(() => {
    if (message && smsListenerReady && step === 'otp') {
      const detectedOtp = detectOtpFromMessage(message);
      if (detectedOtp && detectedOtp.length === 6) {
        setOtp(detectedOtp);
        setWaitingForOtp(false);
        if (!toastShownRef.current.autoDetect) {
          toastShownRef.current.autoDetect = true;
          safeShowToast({ message: '✨ OTP detected automatically!', type: ToastTypes.SUCCESS, duration: 2000, position: ToastPositions.TOP });
          setTimeout(() => { toastShownRef.current.autoDetect = false; }, 3000);
        }
        setTimeout(() => handleVerifyOtp(detectedOtp), 800);
      }
    }
  }, [message, smsListenerReady, step]);

  useEffect(() => {
    if (timeoutError) {
      setWaitingForOtp(false);
      setTimeout(() => otpRef.current?.focus(), 300);
    }
  }, [timeoutError]);

  useEffect(() => {
    if (waitingForOtp && smsListenerReady && Platform.OS === 'android' && step === 'otp') {
      setAutoVerifyTimer(30);
      const interval = setInterval(() => {
        setAutoVerifyTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setWaitingForOtp(false);
            setTimeout(() => otpRef.current?.focus(), 300);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [waitingForOtp, smsListenerReady, step]);

  useEffect(() => {
    const initializeSMSListener = async () => {
      if (Platform.OS === 'android' && step === 'otp') {
        try {
          await getHash();
          if (startListener) {
            startListener();
            setSmsListenerReady(true);
            setWaitingForOtp(true);
          }
        } catch (error) {
          console.error('❌ Error initializing SMS listener:', error);
          setWaitingForOtp(false);
          setSmsListenerReady(false);
          setTimeout(() => otpRef.current?.focus(), 300);
        }
      } else {
        setWaitingForOtp(false);
        setSmsListenerReady(false);
        setTimeout(() => otpRef.current?.focus(), 300);
      }
    };

    initializeSMSListener();

    return () => {
      try {
        removeListener();
        stopListener && stopListener();
        toastShownRef.current = { waiting: false, timeout: false, autoDetect: false, manual: false };
      } catch (error) {
        console.error('Cleanup SMS listener error:', error);
      }
    };
  }, [step]);

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleOtpChange = (value: string) => {
    if (value && waitingForOtp) setWaitingForOtp(false);
    setOtp(value);
  };

  const clearOtp = () => {
    setOtp('');
    otpRef.current?.clear();
  };

  const handleVerifyOtp = async (customOtp: string | null = null) => {
    const otpValue = customOtp || otp;
    if (otpValue.length !== 6) {
      shakeInputs();
      safeShowToast({ message: '⚠️ Please enter 6-digit OTP', type: ToastTypes.WARNING, duration: 2000, position: ToastPositions.TOP });
      return;
    }
    // The backend only exposes a combined verify-OTP + reset-MPIN endpoint,
    // so the OTP is actually validated when the new MPIN is submitted below.
    safeShowToast({ message: 'Enter your new MPIN to continue', type: ToastTypes.INFO, duration: 1500, position: ToastPositions.TOP });
    setTimeout(() => {
      setStep('mpin');
      setTimeout(() => newMpinRef.current?.focus(), 300);
    }, 500);
  };

  const handleResetMpin = async () => {
    if (newMpin.length !== 4) {
      shakeInputs();
      safeShowToast({ message: '⚠️ Please enter 4-digit MPIN', type: ToastTypes.WARNING, duration: 2000, position: ToastPositions.TOP });
      return;
    }
    if (confirmMpin.length !== 4) {
      shakeInputs();
      safeShowToast({ message: '⚠️ Please confirm your MPIN', type: ToastTypes.WARNING, duration: 2000, position: ToastPositions.TOP });
      return;
    }
    if (newMpin !== confirmMpin) {
      shakeInputs();
      safeShowToast({ message: '❌ MPINs do not match', type: ToastTypes.ERROR, duration: 3000, position: ToastPositions.TOP });
      return;
    }

    try {
      await verifyForgotOtp(otp, newMpin);
      safeShowToast({
        message: '🎉 MPIN reset successfully!',
        type: ToastTypes.PREMIUM,
        duration: 2000,
        position: ToastPositions.TOP,
        animationType: ToastAnimationTypes.BOUNCE,
      });
      setTimeout(() => navigation.replace('Login'), 1500);
    } catch (err: any) {
      safeShowToast({ message: `❌ ${err.message}`, type: ToastTypes.ERROR, duration: 3000, position: ToastPositions.TOP });
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0 || loading) return;
    try {
      await sendForgotOtp();
      setTimer(60);
      safeShowToast({ message: '📨 OTP resent successfully!', type: ToastTypes.SUCCESS, duration: 2000, position: ToastPositions.TOP });
      setOtp('');
      otpRef.current?.clear();
      if (Platform.OS === 'android') {
        setWaitingForOtp(true);
        setAutoVerifyTimer(30);
        startListener && startListener();
      }
    } catch (err: any) {
      safeShowToast({ message: `❌ ${err.message}`, type: ToastTypes.ERROR, duration: 3000, position: ToastPositions.TOP });
    }
  };

  const skipAutoVerify = () => {
    setWaitingForOtp(false);
    stopListener && stopListener();
    setTimeout(() => otpRef.current?.focus(), 300);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.root}>
    <MpinScaffold
      headerTitle={step === 'otp' ? 'Verify OTP' : 'Reset MPIN'}
      icon={step === 'otp' ? 'message-lock-outline' : 'lock-reset'}
      heading={step === 'otp' ? 'Enter Verification Code' : 'Create New MPIN'}
      subtitle={
        step === 'otp'
          ? `We've sent a 6-digit code to ${formatMobileNumber(userMobile)}`
          : "Choose a 4-digit MPIN you'll remember"
      }
      onBackPress={step === 'mpin' ? () => setStep('otp') : undefined}
    >

      {step === 'otp' ? (
        <>
          {Platform.OS === 'android' && smsListenerReady && waitingForOtp && (
            <View style={styles.autoCard}>
              <MaterialCommunityIcons name="email-fast-outline" size={SIZES.icon.md} color={COLORS.contentBrand} />
              <View style={styles.autoContent}>
                <Text style={styles.autoTitle}>Auto-detecting OTP</Text>
                <Text style={styles.autoTimer}>{autoVerifyTimer}s remaining</Text>
              </View>
              <Pressable style={styles.skipBtn} onPress={skipAutoVerify} hitSlop={8}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            </View>
          )}

          <Animated.View style={{ transform: [{ translateX: shakeAnimation }], alignItems: 'center' }}>
            <AppOTPInput
              ref={otpRef}
              length={6}
              value={otp}
              onChangeText={handleOtpChange}
              onComplete={(v) => handleVerifyOtp(v)}
              disabled={waitingForOtp}
              autoFocus={!waitingForOtp}
            />
          </Animated.View>

          {otp.length > 0 && (
            <Pressable style={styles.clearBtn} onPress={clearOtp} disabled={waitingForOtp} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={SIZES.icon.sm} color={COLORS.contentMuted} />
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          )}

          <View style={styles.resendRow}>
            {timer > 0 ? (
              <View style={styles.timerChip}>
                <MaterialCommunityIcons name="timer-sand" size={SIZES.icon.sm} color={COLORS.contentBrand} />
                <Text style={styles.timerText}>
                  Resend in <Text style={styles.timerValue}>{formatTime(timer)}</Text>
                </Text>
              </View>
            ) : (
              <Pressable onPress={handleResendOtp} style={styles.resendBtn} disabled={waitingForOtp} hitSlop={8}>
                <MaterialCommunityIcons name="refresh" size={SIZES.icon.sm} color={COLORS.contentBrand} />
                <Text style={styles.resendText}>Resend OTP</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.footer}>
            <LoginButton
              label="Verify & Continue"
              onPress={() => handleVerifyOtp()}
              disabled={otp.length !== 6 || waitingForOtp}
              icon="shield-check"
            />
          </View>
        </>
      ) : (
        <>
          <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
            <Text style={styles.pinLabel}>New MPIN</Text>
            <View style={styles.pinCenter}>
              <AppPinInput
                ref={newMpinRef}
                variant="boxes"
                length={4}
                secureTextEntry
                onChangeText={setNewMpin}
                autoFocus
              />
            </View>

            <Text style={[styles.pinLabel, styles.pinLabelSpaced]}>Confirm MPIN</Text>
            <View style={styles.pinCenter}>
              <AppPinInput
                ref={confirmMpinRef}
                variant="boxes"
                length={4}
                secureTextEntry
                onChangeText={setConfirmMpin}
              />
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <LoginButton
              label="Reset MPIN"
              onPress={handleResetMpin}
              loading={loading}
              disabled={loading || newMpin.length !== 4 || confirmMpin.length !== 4}
              icon="lock-reset"
            />
          </View>
        </>
      )}
    </MpinScaffold>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  autoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteAlpha80,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.space.md,
    marginBottom: SIZES.space.xxl,
    borderWidth: 1,
    borderColor: COLORS.brandAlpha32,
  },
  autoContent: { flex: 1, marginLeft: SIZES.space.sm },
  autoTitle: { fontFamily: FONTS.family.semiBold, fontSize: SIZES.text.sm, color: COLORS.contentPrimary },
  autoTimer: { fontFamily: FONTS.family.regular, fontSize: SIZES.text.xxs, color: COLORS.contentSecondary },
  skipBtn: {
    paddingHorizontal: SIZES.space.lg,
    paddingVertical: SIZES.space.xs,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.brandAlpha16,
  },
  skipText: { fontFamily: FONTS.family.semiBold, fontSize: SIZES.text.xxs, color: COLORS.contentBrand },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.space.lg,
  },
  clearText: {
    fontFamily: FONTS.family.medium,
    fontSize: SIZES.text.sm,
    color: COLORS.contentMuted,
    marginLeft: SIZES.space.xs,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: SIZES.space.xxl,
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.sm,
    color: COLORS.contentSecondary,
    marginLeft: SIZES.space.xs,
  },
  timerValue: { fontFamily: FONTS.family.bold, color: COLORS.contentBrand },
  resendBtn: { flexDirection: 'row', alignItems: 'center' },
  resendText: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.md,
    color: COLORS.contentBrand,
    marginLeft: SIZES.space.xs,
  },
  pinLabel: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.sm,
    color: COLORS.contentPrimary,
    textAlign: 'center',
    marginBottom: SIZES.space.lg,
  },
  pinLabelSpaced: { marginTop: SIZES.space.xxxl },
  pinCenter: { alignItems: 'center' },
  footer: { marginTop: SIZES.space.xxxl },
});

export default VerifyForgotMpinScreen;
