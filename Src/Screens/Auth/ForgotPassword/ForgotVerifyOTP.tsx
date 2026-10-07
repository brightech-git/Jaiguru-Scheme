import { Text } from '../../../Components/Typography/FontText';
import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import useAuth from '../../../api/hooks/Auth/useAuth';
import CommonHeader from '../../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../../Components/PremiumBackground/PremiumBackground';
import theme from '../../../Utills/AppTheme';
import { AppOTPInput, AppOTPInputRef, AppInput, AppButton } from '../../../Components/ui/appcomponents';

const { COLORS, SIZES, FONTS, ELEVATION } = theme;

interface Props {
  route: { params: { contactNumber: string } };
  navigation: any;
}

const ForgotVerifyOTPScreen = ({ route, navigation }: Props) => {
  const { contactNumber } = route.params;

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpRef = useRef<AppOTPInputRef>(null);
  const { updatePassword, loading, sendForgotPassword } = useAuth();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleResendOtp = async () => {
    if (!canResend) return;
    const res: any = await sendForgotPassword({ contactNumber });
    if (!res?.error) {
      Alert.alert('Success', 'OTP resent successfully');
      setTimer(60);
      setCanResend(false);
      setOtp('');
      otpRef.current?.clear();
    } else {
      Alert.alert('Error', res.error);
    }
  };

  const handleResetPassword = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    const res: any = await updatePassword({ contactNumber, otp, newPassword });
    if (!res?.error) {
      Alert.alert('Success', 'Password updated successfully! Please login with your new password.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } else {
      Alert.alert('Error', res.error);
    }
  };

  const isFormValid = () => otp.length === 6 && newPassword.length >= 6 && newPassword === confirmPassword;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <PremiumBackground />
      <CommonHeader title="Verify OTP" transparent borderBottom={false} shadow={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
        <View style={styles.blueAccent} />
        <View style={styles.goldAccent} />

        <View style={styles.content}>
          <View style={styles.headerSection}>
            <View style={styles.iconWrapper}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>✓</Text>
              </View>
            </View>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit OTP sent to <Text style={styles.phoneNumber}>{contactNumber}</Text>
            </Text>
          </View>

          <View style={styles.otpContainer}>
            <AppOTPInput ref={otpRef} length={6} onChangeText={setOtp} autoFocus />
          </View>

          <View style={styles.timerContainer}>
            {timer > 0 ? (
              <Text style={styles.timerText}>
                Resend OTP in <Text style={styles.timerBold}>{timer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOtp} disabled={!canResend}>
                <Text style={[styles.resendText, !canResend && styles.resendDisabled]}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Create New Password</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.passwordSection}>
            <AppInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              isPassword
              hint={newPassword.length > 0 && newPassword.length < 6 ? 'Password must be at least 6 characters' : undefined}
              leftIcon="lock-closed-outline"
              containerStyle={styles.inputWrapper}
            />

            <AppInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              isPassword
              error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
              leftIcon="lock-closed-outline"
              containerStyle={styles.inputWrapper}
            />

            {newPassword.length > 0 && confirmPassword.length > 0 && (
              <View style={styles.passwordIndicator}>
                <View style={styles.indicatorRow}>
                  <Text style={[styles.indicatorDot, newPassword.length >= 6 ? styles.validIcon : styles.invalidIcon]}>
                    {newPassword.length >= 6 ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.indicatorText, newPassword.length >= 6 && styles.validText]}>Minimum 6 characters</Text>
                </View>

                <View style={[styles.indicatorRow, { marginBottom: 0 }]}>
                  <Text style={[styles.indicatorDot, newPassword === confirmPassword && confirmPassword ? styles.validIcon : styles.invalidIcon]}>
                    {newPassword === confirmPassword && confirmPassword ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.indicatorText, newPassword === confirmPassword && confirmPassword && styles.validText]}>
                    Passwords match
                  </Text>
                </View>
              </View>
            )}
          </View>

          <AppButton
            label="Update Password"
            onPress={handleResetPassword}
            disabled={loading || !isFormValid()}
            loading={loading}
            variant="primary"
            size="lg"
          />

          <TouchableOpacity style={styles.backToLogin} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surfacePage },
  scrollContent: { flexGrow: 1, paddingBottom: SIZES.space.xxxl },
  blueAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIZES.screen.width * 0.28,
    height: SIZES.screen.width * 0.28,
    backgroundColor: COLORS.brandAlpha16,
    borderBottomRightRadius: SIZES.radius.xxl,
  },
  goldAccent: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: SIZES.screen.width * 0.35,
    height: SIZES.screen.width * 0.35,
    backgroundColor: COLORS.brandAlpha08,
    borderTopLeftRadius: SIZES.radius.xxl,
  },
  content: { paddingHorizontal: SIZES.space.xl, paddingTop: SIZES.space.xl },
  headerSection: { alignItems: 'center', marginBottom: SIZES.space.xl },
  iconWrapper: { marginBottom: SIZES.space.md },
  iconCircle: {
    width: SIZES.icon.avatar,
    height: SIZES.icon.avatar,
    borderRadius: SIZES.icon.avatar / 2,
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
    ...ELEVATION.brandGlow,
  },
  iconText: { fontSize: SIZES.text.xxl, color: COLORS.contentOnBrand, fontWeight: 'bold', lineHeight: SIZES.text.xxl * 1.2 },
  title: { ...FONTS.display, color: COLORS.contentBrand, marginBottom: SIZES.space.xs, textAlign: 'center' },
  subtitle: { ...FONTS.bodySm, color: COLORS.contentSecondary, textAlign: 'center', paddingHorizontal: SIZES.space.lg, lineHeight: SIZES.text.sm * 1.6 },
  phoneNumber: { ...FONTS.bodyEmphasis, color: COLORS.contentBrand },
  otpContainer: { marginBottom: SIZES.space.md, alignItems: 'center' },
  timerContainer: { alignItems: 'center', marginBottom: SIZES.space.lg, minHeight: 24 },
  timerText: { ...FONTS.bodySm, color: COLORS.contentSecondary },
  timerBold: { ...FONTS.bodyEmphasis, color: COLORS.contentBrand },
  resendText: { ...FONTS.bodyEmphasis, color: COLORS.contentBrand, textDecorationLine: 'underline' },
  resendDisabled: { color: COLORS.contentPlaceholder, textDecorationLine: 'none' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: SIZES.space.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.borderStrong },
  dividerText: { ...FONTS.bodySm, color: COLORS.contentSecondary, marginHorizontal: SIZES.space.sm },
  passwordSection: { marginBottom: SIZES.space.xl },
  inputWrapper: { marginBottom: SIZES.space.lg },
  passwordIndicator: {
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.space.md,
    paddingVertical: SIZES.space.sm,
    marginTop: SIZES.space.xs,
  },
  indicatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.space.xs },
  indicatorDot: { fontSize: SIZES.text.md, width: 20, textAlign: 'center' },
  validIcon: { color: COLORS.success },
  invalidIcon: { color: COLORS.contentPlaceholder },
  indicatorText: { ...FONTS.bodySm, color: COLORS.contentSecondary, flex: 1 },
  validText: { color: COLORS.success },
  backToLogin: { marginTop: SIZES.space.md, alignSelf: 'center', paddingVertical: SIZES.space.sm, paddingHorizontal: SIZES.space.lg },
  backToLoginText: { ...FONTS.bodyEmphasis, color: COLORS.contentBrand, textDecorationLine: 'underline' },
});

export default ForgotVerifyOTPScreen;
