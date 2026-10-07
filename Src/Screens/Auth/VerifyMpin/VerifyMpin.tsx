import { Text } from '../../../Components/Typography/FontText';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Pressable, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useMpin } from '../../../api/hooks/Mpin/useMpin';
import { useRegisterLoginCheckUser } from '../../../api/hooks/LoginCheck/useLoginCheck';
import { useToast, ToastTypes, ToastPositions } from '../../../Components/Toast/Toast';
import theme from '../../../Utills/AppTheme';
import { AppPinInput, AppPinInputRef } from '../../../Components/ui/appcomponents';
import MpinScaffold from '../Mpin/MpinScaffold';
import LoginButton from '../Login/components/LoginButton';
import { clearAuthData } from '../../../Utills/AsynchStorageHelper';
import { clearFCMToken } from '../../../Helpers/NotificationHelper';

const { COLORS, SIZES, FONTS } = theme;
const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 60;

const MpinVerifyScreen = () => {
  const navigation = useNavigation<any>();
  const { verifyMpin, loading } = useMpin();
  const { register } = useRegisterLoginCheckUser();
  const { showToast, Toast } = useToast();

  const [mpinValue, setMpinValue] = useState('');
  const [showMpin, setShowMpin] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [blockAutoSubmit, setBlockAutoSubmit] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const pinRef = useRef<AppPinInputRef>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resetMpin = useCallback(() => {
    setMpinValue('');
    pinRef.current?.clear();
  }, []);

  useEffect(() => {
    if (locked && lockTime > 0) {
      timerRef.current = setInterval(() => {
        setLockTime((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setLocked(false);
            setAttempts(0);
            resetMpin();
            pinRef.current?.focus();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [locked, lockTime, resetMpin]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, []);

  const handleSubmit = useCallback(
    async (mpinArg: string | null = null) => {
      if (locked || loading) return;
      const mpinString = mpinArg || mpinValue;
      if (mpinString.length !== 4) return;

      try {
        await verifyMpin(mpinString);
        resetMpin();
        setAttempts(0);
        setBlockAutoSubmit(false);

        showToast({
          message: 'G-PIN verified successfully!',
          type: ToastTypes.SUCCESS,
          duration: 2000,
          position: ToastPositions.TOP,
        });

        setTimeout(async () => {
          try {
            const today = new Date().toISOString().split('T')[0];
            const lastDate = await AsyncStorage.getItem('dailyRegisterDate');
            if (lastDate !== today) {
              const userData = await AsyncStorage.getItem('userData');
              if (userData) {
                const user = JSON.parse(userData);
                const mobileNumber = user.contactNumber || user.mobileNumber || user.phone;
                const username = user.username || user.name;
                if (mobileNumber && username) {
                  await register(username, mobileNumber);
                  await AsyncStorage.setItem('dailyRegisterDate', today);
                }
              }
            }
          } catch (e) {
            console.log('Daily register error:', e);
          }
          navigation.reset({ index: 0, routes: [{ name: 'MainDrawer' }] });
        }, 300);
      } catch (err: any) {
        if (err?.code === 'MPIN_NOT_FOUND' || err?.status === 404) {
          resetMpin();
          setAttempts(0);
          setBlockAutoSubmit(false);
          Alert.alert(
            'G-PIN Not Created',
            "You don't have a G-PIN for this account. Please create one to continue.",
            [{ text: 'Create G-PIN', onPress: () => navigation.navigate('MpinCreate') }],
            { cancelable: false },
          );
          return;
        }

        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLocked(true);
          setLockTime(LOCK_DURATION);
          showToast({
            message: `Too many attempts! Account locked for ${LOCK_DURATION} seconds`,
            type: ToastTypes.ERROR,
            duration: 3000,
            position: ToastPositions.TOP,
          });
        } else {
          showToast({
            message: `Invalid G-PIN! ${MAX_ATTEMPTS - newAttempts} attempts remaining`,
            type: ToastTypes.ERROR,
            duration: 2000,
            position: ToastPositions.TOP,
          });
        }

        resetMpin();
        pinRef.current?.focus();
      }
    },
    [locked, loading, mpinValue, attempts, verifyMpin, navigation, showToast, register, resetMpin],
  );

  const handleMpinChange = useCallback(
    (value: string) => {
      if (locked || blockAutoSubmit) return;
      setMpinValue(value);
    },
    [locked, blockAutoSubmit],
  );

  const handleMpinComplete = useCallback(
    (value: string) => {
      if (locked || blockAutoSubmit) return;
      setTimeout(() => handleSubmit(value), 150);
    },
    [locked, blockAutoSubmit, handleSubmit],
  );

  const handleForgotMpin = useCallback(() => {
    if (locked) return;
    Alert.alert('Forgot G-PIN?', 'Do you want to reset your G-PIN?', [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => { resetMpin(); pinRef.current?.focus(); },
      },
      {
        text: 'Reset G-PIN',
        style: 'destructive',
        onPress: () => {
          showToast({ message: 'Redirecting to G-PIN reset...', type: ToastTypes.INFO, duration: 2000, position: ToastPositions.TOP });
          resetMpin();
          setAttempts(0);
          setTimeout(() => navigation.navigate('ForgotMpin'), 500);
        },
      },
    ]);
  }, [navigation, showToast, locked, resetMpin]);

  const handleLogout = useCallback(() => {
    if (loading || loggingOut) return;
    setBlockAutoSubmit(true);
    resetMpin();
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel', onPress: () => setBlockAutoSubmit(false) },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            const result = await clearAuthData();
            if (!result.success) throw new Error(result.error || 'Unable to logout');
            await clearFCMToken();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch {
            setLoggingOut(false);
            setBlockAutoSubmit(false);
            showToast({ message: 'Unable to logout. Please try again.', type: ToastTypes.ERROR, duration: 3000, position: ToastPositions.TOP });
          }
        },
      },
    ], { cancelable: false });
  }, [loading, loggingOut, navigation, resetMpin, showToast]);

  const isSubmitDisabled = loading || locked || blockAutoSubmit || mpinValue.length !== 4;

  return (
    <View style={styles.root}>
      <MpinScaffold
        // headerTitle="Verify MPIN"
        icon="shield-key-outline"
        heading="Verify G-PIN"
        subtitle="Enter your 4-digit security G-PIN to access your account"
        showBack={false}
        bottomContent={
        <Pressable
          onPress={handleLogout}
          disabled={loading || loggingOut || blockAutoSubmit}
          accessibilityRole="button"
          accessibilityLabel="Logout"
          style={[styles.logoutBtn, (loading || loggingOut || blockAutoSubmit) && styles.disabled]}
        >
          <MaterialCommunityIcons name="logout" size={SIZES.icon.sm} color={COLORS.danger} />
          <Text style={styles.logoutText}>{loggingOut ? 'Logging out...' : 'Logout'}</Text>
        </Pressable>
        }
      >
        {locked && (
          <View style={styles.lockBox}>
            <MaterialCommunityIcons name="lock-alert-outline" size={SIZES.icon.xl} color={COLORS.danger} />
            <Text style={styles.lockTitle}>Account Temporarily Locked</Text>
            <Text style={styles.lockText}>Please wait {formatTime(lockTime)} before trying again</Text>
            <View style={styles.timerTrack}>
              <View style={[styles.timerFill, { width: `${(1 - lockTime / LOCK_DURATION) * 100}%` }]} />
            </View>
          </View>
        )}

        <View style={styles.pinRow}>
          <AppPinInput
            ref={pinRef}
            variant="boxes"
            length={4}
            secureTextEntry={!showMpin}
            onChangeText={handleMpinChange}
            onComplete={handleMpinComplete}
            disabled={locked || blockAutoSubmit}
            autoFocus
          />
          <Pressable style={styles.eyeBtn} onPress={() => setShowMpin(!showMpin)} hitSlop={10}>
            <MaterialCommunityIcons name={showMpin ? 'eye-off' : 'eye'} size={SIZES.icon.md} color={COLORS.contentBrand} />
          </Pressable>
        </View>

        {attempts > 0 && !locked && (
          <View style={styles.attemptsRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={SIZES.icon.sm} color={COLORS.warning} />
            <Text style={styles.attemptsText}>
              {attempts} failed attempt{attempts !== 1 ? 's' : ''}
            </Text>
            <View style={styles.attemptsDots}>
              {[1, 2, 3, 4, 5].map((dot) => (
                <View key={dot} style={[styles.attemptDot, dot <= attempts && styles.attemptDotFilled]} />
              ))}
            </View>
          </View>
        )}

        <Pressable
          onPress={handleForgotMpin}
          disabled={locked || blockAutoSubmit}
          style={[styles.forgotBtn, (locked || blockAutoSubmit) && styles.disabled]}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="key-outline" size={SIZES.icon.sm} color={COLORS.contentBrand} />
          <Text style={styles.forgotText}>Forgot G-PIN?</Text>
        </Pressable>

        <View style={styles.footer}>
          <LoginButton
            label={locked ? 'Account Locked' : blockAutoSubmit ? 'Please Wait…' : 'Verify & Continue'}
            onPress={() => handleSubmit()}
            loading={loading}
            disabled={isSubmitDisabled}
            icon="shield-check"
          />
        </View>



        <View style={styles.secureRow}>
          <MaterialCommunityIcons name="shield-check" size={SIZES.icon.xs} color={COLORS.success} />
          <Text style={styles.secureText}>Your G-PIN is stored securely on your device</Text>
        </View>
      </MpinScaffold>

      {/* Toast rendered at root level — outside ScrollView — so it always shows at top */}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  lockBox: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.space.lg,
    marginBottom: SIZES.space.xxl,
    borderWidth: 1,
    borderColor: `${COLORS.danger}30`,
  },
  lockTitle: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.lg,
    color: COLORS.danger,
    marginTop: SIZES.space.sm,
  },
  lockText: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.sm,
    color: COLORS.contentSecondary,
    marginTop: SIZES.space.xs,
  },
  timerTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginTop: SIZES.space.lg,
    overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: 2, backgroundColor: COLORS.danger },
  pinRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  eyeBtn: { padding: SIZES.space.xs },
  attemptsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.space.lg,
  },
  attemptsText: {
    fontFamily: FONTS.family.medium,
    fontSize: SIZES.text.sm,
    color: COLORS.warningText,
    marginLeft: SIZES.space.xs,
    marginRight: SIZES.space.sm,
  },
  attemptsDots: { flexDirection: 'row' },
  attemptDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.borderStrong,
    marginHorizontal: 2,
  },
  attemptDotFilled: { backgroundColor: COLORS.danger },
  forgotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.space.xxl,
  },
  forgotText: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.md,
    color: COLORS.contentBrand,
    marginLeft: SIZES.space.xs,
  },
  disabled: { opacity: 0.5 },
  footer: { marginTop: SIZES.space.xxxl },
  logoutBtn: {
    alignSelf: 'center',
    flexShrink: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.space.sm,
    paddingHorizontal: SIZES.space.lg,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: SIZES.radius.lg,
  },
  logoutText: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.sm,
    color: COLORS.danger,
    marginLeft: SIZES.space.xs,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.space.xxl,
  },
  secureText: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.xxs,
    color: COLORS.contentSecondary,
    marginLeft: SIZES.space.xs,
  },
});

export default MpinVerifyScreen;
