import React, { useEffect, useRef, useState } from 'react';
import { Modal, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../Components/PremiumBackground/PremiumBackground';
import { AppText } from '../../Components/ui/appcomponents';
import { COLORS, FONTS, SIZES } from '../../Utills/AppTheme';
import { redemptionService } from '../../api/services/redemptionService';

export default function RedemptionOtp() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const returnHome = () => {
    setShowSuccess(false);
    navigation.reset({ index: 0, routes: [{ name: 'MainDrawer', params: { screen: 'Home' } }] });
  };
  const input = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const resendAvailableAt = useRef(Date.now() + 60_000);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(Math.max(0, Math.ceil((resendAvailableAt.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const requestPending = useRef(false);
  const [verified, setVerified] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mobile, setMobile] = useState(String(route.params?.mobile || '').trim());
  const maskedMobile = /^\+?\d[\d\s-]*$/.test(mobile)
    ? `••••••${mobile.replace(/\D/g, '').slice(-4)}`
    : mobile;
  const account = route.params?.accountData;
  const resend = async () => {
    if (Date.now() < resendAvailableAt.current || requestPending.current || verified) return;
    requestPending.current = true;
    setBusy(true);
    setResending(true);
    setMessage('');
    try {
      if (!account?.groupCode || !Number.isInteger(Number(account?.regNo))) throw new Error('Please select your scheme again.');
      const response = await redemptionService.sendOtp({ groupCode: account.groupCode, regNo: Number(account.regNo) });
      // Restart the cooldown after the server accepts the request.
      resendAvailableAt.current = Date.now() + 60_000;
      setSecondsRemaining(60);
      setCode('');
      if (typeof response.mobile !== 'string' || !response.mobile.trim()) throw new Error('OTP response did not include a mobile number. Please contact support.');
      setMobile(response.mobile.trim());
      setMessage('A new OTP has been sent. Please enter the latest code.');
      input.current?.focus();
    } catch (error: any) {
      setMessage(error?.message || 'Unable to resend OTP. Please try again.');
    } finally {
      requestPending.current = false;
      setBusy(false);
      setResending(false);
    }
  };
  const verify = async () => {
    if (code.length !== 6 || requestPending.current || verified) return;
    Keyboard.dismiss();
    requestPending.current = true;
    setBusy(true);
    setMessage('');
    try {
      if (!account?.groupCode || !Number.isInteger(Number(account?.regNo))) throw new Error('Please select your scheme again.');
      const details = { groupCode: account.groupCode, regNo: Number(account.regNo) };
      const response = await redemptionService.verifyOtp({ ...details, otp: Number(code) });
      if (response.verified !== true) throw new Error('Unable to confirm verification from the server response. Please contact support.');
      setVerified(true);
      setMessage('Your OTP has been verified successfully.');
      setShowSuccess(true);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to complete your request. Please try again.');
    } finally {
      requestPending.current = false;
      setBusy(false);
    }
  };

  return <View style={styles.root}>
    <PremiumBackground />
    <CommonHeader title="Verify Redemption" showBack transparent borderBottom={false} shadow={false} />
    <SafeAreaView edges={['bottom']} style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.icon}><MaterialCommunityIcons name="shield-lock-outline" size={36} color={COLORS.brand} /></View>
            <AppText variant="h3" align="center" color={COLORS.brand}>Verify your OTP</AppText>
            <AppText variant="bodyBold" align="center" color={COLORS.contentSecondary} style={styles.description}>Enter the 6 digit verification code sent to your Mobile number{maskedMobile ? ` ${maskedMobile}` : ''}</AppText>
            {!!account && <AppText variant="captionBold" align="center" color={COLORS.brand} style={styles.scheme}>Scheme {account.groupCode}-{account.regNo}</AppText>}
            <View style={styles.otpWrap}>
              <View pointerEvents="none" style={styles.digits}>
                {Array.from({ length: 6 }, (_, index) => <View key={index} style={[styles.digit, focused && index === Math.min(code.length, 5) && styles.activeDigit]}>
                  <AppText variant="h4" color={COLORS.brand}>{code[index] || ''}</AppText>
                </View>)}
              </View>
              <TextInput ref={input} value={code} onChangeText={value => { setCode(value.replace(/\D/g, '').slice(0, 6)); setMessage(''); }}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                style={styles.input} keyboardType="number-pad" maxLength={6}
                textContentType="oneTimeCode" autoComplete="sms-otp" importantForAutofill="yes"
                caretHidden selectionColor="transparent" accessibilityLabel="Six digit redemption verification code"
                editable={!busy && !verified} autoFocus />
            </View>
            <AppText variant="caption" align="center" color={COLORS.contentMuted}>Do not share your OTP with anyone.</AppText>
            {!verified && <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || secondsRemaining > 0 }} disabled={busy || secondsRemaining > 0} onPress={resend} style={styles.resend}>
              <AppText variant="captionBold" align="center" color={busy || secondsRemaining > 0 ? COLORS.contentMuted : COLORS.brand}>
                {resending ? 'Sending OTP…' : secondsRemaining > 0 ? `Resend OTP in 00:${String(secondsRemaining).padStart(2, '0')}` : 'Resend OTP'}
              </AppText>
            </Pressable>}
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || code.length !== 6 || verified }} disabled={busy || code.length !== 6 || verified} onPress={verify} style={[styles.button, (busy || code.length !== 6 || verified) && styles.disabled]}>
              <AppText variant="button" color={COLORS.contentOnBrand}>{busy ? 'Please wait…' : verified ? 'OTP Verified' : 'Verify OTP'}</AppText>
            </Pressable>
            {!!message && <View accessibilityLiveRegion="polite" style={styles.message}><AppText variant="bodySmall" align="center" color={COLORS.brand}>{message}</AppText></View>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    <Modal visible={showSuccess} transparent animationType="fade" statusBarTranslucent onRequestClose={returnHome}>
      <View style={styles.modalBackdrop}>
        <View accessibilityViewIsModal style={styles.modalCard}>
          <View style={styles.successIcon}><MaterialCommunityIcons name="check-decagram" size={48} color={COLORS.brand} /></View>
          <AppText variant="h4" align="center" color={COLORS.brand}>Redemption Successful</AppText>
          <AppText variant="body" align="center" color={COLORS.contentSecondary} style={styles.description}>You have redeemed successfully.</AppText>
          {!!account && <AppText variant="captionBold" align="center" color={COLORS.brand} style={styles.scheme}>Scheme {account.groupCode}-{account.regNo}</AppText>}
          <Pressable accessibilityRole="button" onPress={returnHome} style={styles.button}>
            <AppText variant="button" color={COLORS.contentOnBrand}>Done</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20, 8, 16, 0.6)', alignItems: 'center', justifyContent: 'center', padding: SIZES.space.lg },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: COLORS.accentTint, borderRadius: SIZES.radius.card, borderWidth: 1, borderColor: COLORS.accentAlpha32, padding: SIZES.space.xl },
  successIcon: { alignSelf: 'center', width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.space.lg },
  root: { flex: 1, backgroundColor: COLORS.accentTint }, flex: { flex: 1 },
  content: { flexGrow: 1,paddingTop: SIZES.space.huge, justifyContent: 'flex-start', padding: SIZES.space.lg },
  card: { backgroundColor: COLORS.whiteAlpha90, borderRadius: SIZES.radius.card, padding: SIZES.space.lg, borderWidth: 1, borderColor: COLORS.brandAlpha16, paddingBottom: SIZES.space.lg },
  icon: { width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.brandAlpha08, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.space.lg },
  description: { marginTop: SIZES.space.sm, lineHeight: 23 }, scheme: { marginTop: SIZES.space.md },
  otpWrap: { marginVertical: SIZES.space.xl, height: 56 }, digits: { flexDirection: 'row', gap: 7, height: '100%' },
  digit: { flex: 1, borderRadius: SIZES.radius.sm, borderWidth: 1, borderColor: COLORS.brandAlpha16, backgroundColor: COLORS.accentTint, alignItems: 'center', justifyContent: 'center' },
  activeDigit: { borderColor: COLORS.brand, borderWidth: 2 },
  input: { ...StyleSheet.absoluteFillObject, color: 'transparent', backgroundColor: 'transparent', fontFamily: FONTS.family.regular, fontSize: 1 },
  button: { backgroundColor: COLORS.brand, borderRadius: SIZES.radius.md, paddingVertical: SIZES.space.md, alignItems: 'center', marginTop: SIZES.space.xl },
  disabled: { opacity: 0.45 }, message: { padding: SIZES.space.md, backgroundColor: COLORS.brandAlpha08, borderRadius: SIZES.radius.md, marginTop: SIZES.space.md }, preview: { marginTop: SIZES.space.lg },
  resend: { paddingVertical: SIZES.space.md, alignItems: 'center', marginTop: SIZES.space.sm },
});
