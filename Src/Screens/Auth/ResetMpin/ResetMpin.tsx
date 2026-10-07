import { Text } from '../../../Components/Typography/FontText';
// Src/Screens/Auth/ResetMpin/ResetMpin.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Pressable, Keyboard, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMpin } from '../../../api/hooks/Mpin/useMpin';
import { useToast, ToastTypes, ToastPositions } from '../../../Components/Toast/Toast';
import theme from '../../../Utills/AppTheme';
import { AppPinInput, AppPinInputRef } from '../../../Components/ui/appcomponents';
import MpinScaffold from '../Mpin/MpinScaffold';
import LoginButton from '../Login/components/LoginButton';

const { COLORS, SIZES, FONTS } = theme;
const LOCK_DURATION = 120;

type Section = 'old' | 'new';

interface MpinValidations {
  length: boolean;
  consecutive: boolean;
  repeated: boolean;
  sequence: boolean;
}

const VALIDATION_LABELS: { key: keyof MpinValidations; label: string }[] = [
  { key: 'length', label: 'Exactly 4 digits' },
  { key: 'consecutive', label: 'No consecutive run' },
  { key: 'repeated', label: 'No repeated digits' },
  { key: 'sequence', label: 'Not a common sequence' },
];

const ResetMpinScreen = () => {
  const navigation = useNavigation<any>();
  const { resetMpinDirect, loading } = useMpin();
  const { showToast, Toast } = useToast();

  const [oldMpin, setOldMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [showOldMpin, setShowOldMpin] = useState(false);
  const [showNewMpin, setShowNewMpin] = useState(false);
  const [step, setStep] = useState<'old' | 'new'>('old');
  const [, setActiveSection] = useState<Section>('old');
  const [mpinValidations, setMpinValidations] = useState<MpinValidations>({
    length: false,
    consecutive: false,
    repeated: false,
    sequence: false,
  });

  const oldRef = useRef<AppPinInputRef>(null);
  const newRef = useRef<AppPinInputRef>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [stepKey, setStepKey] = useState(0);

  const resetAllMpin = useCallback(() => {
    setOldMpin('');
    setNewMpin('');
    oldRef.current?.clear();
    newRef.current?.clear();
    setActiveSection('old');
    setStep('old');
    setMpinValidations({ length: false, consecutive: false, repeated: false, sequence: false });
    setTimeout(() => oldRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (isLocked && lockTime > 0) {
      timerRef.current = setInterval(() => {
        setLockTime((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsLocked(false);
            resetAllMpin();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLocked, lockTime, resetAllMpin]);

  const validateMpin = useCallback((mpinString: string) => {
    const validations: MpinValidations = {
      length: mpinString.length === 4,
      consecutive: !/(012|123|234|345|456|567|678|789|890)/.test(mpinString),
      repeated: !/(\d)\1{2,}/.test(mpinString),
      sequence: !/^(0123|1234|2345|3456|4567|5678|6789|7890)$/.test(mpinString),
    };
    setMpinValidations(validations);
    return Object.values(validations).every((v) => v);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleSubmit = useCallback(
    async (newMpinArg: string | null = null) => {
      if (isLocked) return;

      const oldMpinString = oldMpin;
      const newMpinString = newMpinArg ?? newMpin;

      if (oldMpinString.length !== 4 || newMpinString.length !== 4) {
        showToast({ message: 'Please enter all 4-digit MPINs', type: ToastTypes.WARNING, duration: 3000, position: ToastPositions.TOP });
        return;
      }

      if (!validateMpin(newMpinString)) {
        showToast({ title: 'Weak MPIN', message: 'Please choose a stronger MPIN', type: ToastTypes.WARNING, duration: 4000, position: ToastPositions.TOP });
        return;
      }

      try {
        const result = await resetMpinDirect(oldMpinString, newMpinString);
        console.log('API call successful:', result);
        resetAllMpin();
        showToast({ message: 'MPIN reset successfully!', type: ToastTypes.SUCCESS, duration: 3000, position: ToastPositions.TOP });
        setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'MpinVerify' }] }), 1000);
      } catch (err: any) {
        console.error('API call failed:', err);
        showToast({
          title: 'Reset Failed',
          message: err.message || 'Failed to reset MPIN. Please try again.',
          type: ToastTypes.ERROR,
          duration: 4000,
          position: ToastPositions.TOP,
        });
      }
    },
    [oldMpin, newMpin, isLocked, resetMpinDirect, showToast, navigation, validateMpin, resetAllMpin],
  );

  const handleOldComplete = useCallback((value: string) => {
    setOldMpin(value);
    setNewMpin('');
    newRef.current?.clear();
    setActiveSection('new');
    setStep('new');
    setStepKey((k) => k + 1);
    setTimeout(() => newRef.current?.focus(), 150);
  }, []);

  const goToNewStep = useCallback(() => {
    if (oldMpin.length !== 4 || isLocked) return;
    setNewMpin('');
    newRef.current?.clear();
    setMpinValidations({ length: false, consecutive: false, repeated: false, sequence: false });
    setStep('new');
    setStepKey((k) => k + 1);
    setTimeout(() => newRef.current?.focus(), 150);
  }, [oldMpin, isLocked]);

  const handleNewComplete = useCallback(
    (value: string) => {
      setNewMpin(value);
      if (validateMpin(value)) setTimeout(() => handleSubmit(value), 100);
    },
    [validateMpin, handleSubmit],
  );

  const handleBack = useCallback(() => {
    if (isLocked) return;
    Keyboard.dismiss();
    navigation.goBack();
  }, [navigation, isLocked]);

  const isSubmitDisabled = loading || isLocked || oldMpin.length !== 4 || newMpin.length !== 4;

  const renderSection = (
    label: string,
    ref: React.RefObject<AppPinInputRef | null>,
    onChangeText: (v: string) => void,
    onComplete: (v: string) => void,
    secure: boolean,
    onToggle: () => void,
    autoFocus = false,
    inputKey?: string,
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.pinRow}>
        <AppPinInput
          key={inputKey}
          ref={ref}
          variant="boxes"
          length={4}
          secureTextEntry={secure}
          onChangeText={onChangeText}
          onComplete={onComplete}
          disabled={isLocked}
          autoFocus={autoFocus}
        />
        <Pressable style={styles.eyeBtn} onPress={onToggle} hitSlop={8} disabled={isLocked}>
          <MaterialCommunityIcons name={secure ? 'eye' : 'eye-off'} size={SIZES.icon.md} color={COLORS.contentBrand} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
    <MpinScaffold
      headerTitle="Reset MPIN"
      icon={step === 'old' ? 'lock-outline' : 'lock-reset'}
      heading={step === 'old' ? 'Verify Current MPIN' : 'Set New MPIN'}
      subtitle={
        step === 'old'
          ? 'Enter your current 4-digit MPIN to continue.'
          : 'Enter a new 4-digit MPIN.'
      }
      onBackPress={step === 'new' ? () => {
          setStep('old');
          setNewMpin('');
          newRef.current?.clear();
          setMpinValidations({ length: false, consecutive: false, repeated: false, sequence: false });
          setTimeout(() => oldRef.current?.focus(), 150);
        } : handleBack}
    >
      {/* Step indicator */}
      <View style={styles.stepsRow}>
        <View style={[styles.stepDot, styles.stepDotActive]}>
          <Text style={styles.stepNumActive}>1</Text>
        </View>
        <View style={[styles.connector, step === 'new' && styles.connectorActive]} />
        <View style={[styles.stepDot, step === 'new' ? styles.stepDotActive : styles.stepDotInactive]}>
          <Text style={step === 'new' ? styles.stepNumActive : styles.stepNumInactive}>2</Text>
        </View>
      </View>

      {isLocked && (
        <View style={styles.lockBox}>
          <MaterialCommunityIcons name="lock-alert-outline" size={SIZES.icon.xl} color={COLORS.danger} />
          <Text style={styles.lockTitle}>Temporarily Locked</Text>
          <Text style={styles.lockText}>Please wait {formatTime(lockTime)} before trying again</Text>
        </View>
      )}

      {step === 'old' ? (
        <>
          {renderSection('Current MPIN', oldRef, setOldMpin, handleOldComplete, !showOldMpin, () => setShowOldMpin((v) => !v), true)}

          <View style={styles.footer}>
            <LoginButton
              label="Continue"
              onPress={goToNewStep}
              disabled={isLocked || oldMpin.length !== 4}
              icon="arrow-right"
            />
          </View>
        </>
      ) : (
        <>
          {renderSection('New MPIN', newRef, setNewMpin, handleNewComplete, !showNewMpin, () => setShowNewMpin((v) => !v), true, `new-${stepKey}`)}

          {newMpin.length > 0 && (
            <View style={styles.rules}>
              {VALIDATION_LABELS.map(({ key, label }) => {
                const ok = mpinValidations[key];
                return (
                  <View key={key} style={styles.ruleRow}>
                    <MaterialCommunityIcons
                      name={ok ? 'check-circle' : 'circle-outline'}
                      size={SIZES.icon.sm}
                      color={ok ? COLORS.success : COLORS.contentMuted}
                    />
                    <Text style={[styles.ruleText, ok && styles.ruleTextOk]}>{label}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.footer}>
            <LoginButton
              label={isLocked ? 'Locked' : 'Reset MPIN'}
              onPress={() => handleSubmit()}
              loading={loading}
              disabled={isSubmitDisabled}
              icon="lock-check"
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
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.space.xxxl,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: COLORS.brand },
  stepDotInactive: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.accentSubtle,
  },
  stepNumActive: { fontFamily: FONTS.family.bold, fontSize: SIZES.text.sm, color: COLORS.contentOnBrand },
  stepNumInactive: { fontFamily: FONTS.family.bold, fontSize: SIZES.text.sm, color: COLORS.contentMuted },
  connector: {
    width: 48,
    height: 3,
    marginHorizontal: SIZES.space.sm,
    borderRadius: 2,
    backgroundColor: COLORS.accentSubtle,
  },
  connectorActive: { backgroundColor: COLORS.brand },
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
  section: {
    marginBottom: SIZES.space.xxl,
  },
  sectionLabel: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.sm,
    color: COLORS.contentPrimary,
    textAlign: 'center',
    marginBottom: SIZES.space.lg,
  },
  pinRow: { alignItems: 'center' },
  eyeBtn: { marginTop: SIZES.space.lg, padding: SIZES.space.xs },
  rules: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: SIZES.space.xxl,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    paddingVertical: SIZES.space.xs / 2,
  },
  ruleText: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.xxs,
    color: COLORS.contentMuted,
    marginLeft: SIZES.space.xs,
  },
  ruleTextOk: {
    color: COLORS.contentPrimary,
    fontFamily: FONTS.family.medium,
  },
  footer: { marginTop: SIZES.space.sm },
});

export default ResetMpinScreen;
