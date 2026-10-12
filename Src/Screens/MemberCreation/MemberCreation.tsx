// Src/Screens/MemberCreation/MemberCreation.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SchemeJoiningForm, { SchemeJoiningFormRef } from './SchemeJoiningForm';
import { useRazorpayPayment } from '../../api/hooks/Razorpay/useRazorpay';
import PaymentModal from './PaymentModal';
import { buildSchemeJoinSuccess } from './schemeJoinSuccess';
import { DEFAULT_EMPLOYEE_ID } from './EmployeePickerModal';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../Components/PremiumBackground/PremiumBackground';
import { getUserData } from '../../Utills/AsynchStorageHelper';
import { Scheme } from '../../types/Scheme/Scheme';
import { CreateMemberPayload } from '../../types/Member/Member';
import { AppButton, AppText } from '../../Components/ui/appcomponents';
import theme from '../../Utills/AppTheme';
import { PAYMENT_CONSTANTS } from '../../constants/paymentConstants';

const { COLORS, SIZES, FONTS, ELEVATION } = theme;

type MemberCreationRouteParams = { scheme?: Scheme } | undefined;

const MemberCreation = () => {
  const route = useRoute<RouteProp<Record<string, MemberCreationRouteParams>, string>>();
  const navigation = useNavigation<any>();
  const { scheme } = route.params || {};
  const [schemeJoiningData] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState<Record<string, any>>({});

  const [payableAmount, setPayableAmount] = useState<number | null>(null);

  // Refs
  const schemeFormRef = useRef<SchemeJoiningFormRef>(null);

  // Hooks

  const {
    loading: paymentLoading,
    startPayment,
    paymentStep,
    error: paymentError,
    resetState: resetPayment,
    PAYMENT_STEPS,
  } = useRazorpayPayment();

  useFocusEffect(useCallback(() => {
    if (!paymentLoading && paymentStep === PAYMENT_STEPS.IDLE) resetPayment();
  }, [paymentLoading, paymentStep, resetPayment]));

  useEffect(() => {
    let active = true;
    getUserData().then(user => {
      if (active && user) setLoggedInUser(user);
    }).catch(error => console.log('Failed to load signed-in user', error));
    return () => { active = false; };
  }, []);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  /** Minimal joining payload; personal details are maintained in the separate KYC flow. */
  const createJoiningPayload = useCallback(
    (formData: any): CreateMemberPayload => {
      const loginName = String(loggedInUser?.username || loggedInUser?.name || '').trim();
      const customerName = String(loggedInUser?.customerName || '').trim();
      const loginMobile = String(
        loggedInUser?.contactNumber || loggedInUser?.mobileNumber || loggedInUser?.mobile || loggedInUser?.phone || ''
      ).trim();
      const iEmp = String(formData.employeeId || '').trim() || DEFAULT_EMPLOYEE_ID;

      return {
        newMember: {
          pName: customerName || loginName || 'Customer',
          mobile: loginMobile,
          userId: '999',
          appVer: 'Web',
          nomeni: String(formData.nickname || '').trim(),
        },
        createSchemeSummary: {
          schemeId: formData.schemeId || 0,
          groupCode: formData.selectedScheme || '',
        
          iEmp,
        },
        schemeCollectInsert: {
          amount: formData.amount || 0,
        },
      } as any;
    },
    [loggedInUser]
  );

  const handleSubmit = useCallback(async () => {
    // Guard: prevent double-tap / re-entry while payment is already in flight
    if (paymentLoading) return;
    if (!schemeFormRef.current) return;

    const isValid = schemeFormRef.current.validateAndSubmit();
    if (!isValid) return;

    const formData = schemeFormRef.current.getFormData();
    const regNo = formData.regNo;
    const groupCode = formData.selectedScheme || 'MAN';

    console.log('[SCHEME JOIN] STEP 2 — Scheme joining form submitted', { scheme: formData.schemeName, groupCode, amount: formData.amount });

    // Built up front and sent as NMDATA on create-order (NEWJOIN=true) —
    // the backend parks it and creates the member automatically once
    // payment is confirmed. There's no more separate member/create call.
    const nmData = createJoiningPayload(formData);
    console.log('[SCHEME JOIN] STEP 2 — Member payload built (NMDATA)', { pName: nmData.newMember.pName, schemeId: nmData.createSchemeSummary.schemeId });

    console.log('[SCHEME JOIN] STEP 2 — Payment request payload', {
      amount: formData.amount || 0,
      regNo,
      groupCode,
      userDetails: {
        name: (loggedInUser?.customerName || loggedInUser?.username || loggedInUser?.name),
        phone: (loggedInUser?.contactNumber || loggedInUser?.mobileNumber || loggedInUser?.mobile || loggedInUser?.phone),
        email: loggedInUser?.email,
      },
      nmData,
    });

    const result = await startPayment(
      formData.amount || 0,
      {
        name: (loggedInUser?.customerName || loggedInUser?.username || loggedInUser?.name),
        phone: (loggedInUser?.contactNumber || loggedInUser?.mobileNumber || loggedInUser?.mobile || loggedInUser?.phone),
        email: loggedInUser?.email,
      },
      regNo,
      groupCode,
      { newJoin: true, nmData }
    );

    if (result.success) {
      console.log('[SCHEME JOIN] STEP 8 — Flow complete. Opening success screen.', { processResult: result.processResult });
      const memberName = String(loggedInUser?.customerName || loggedInUser?.username || loggedInUser?.name || 'Member');
      const details = buildSchemeJoinSuccess(result.processResult ?? result.data, {
        userName: memberName,
        schemeName: formData.schemeName,
        amount: formData.amount,
        groupCode,
      });
      navigation.replace('SchemeJoinSuccess', { details, processResult: result.processResult ?? result.data });
    } else if (result.message !== 'Payment cancelled by user') {
      console.log('[SCHEME JOIN] FLOW FAILED —', result.message);
      Alert.alert(result.pending ? 'Payment status' : 'Payment Failed', result.message || 'Payment failed');
    }
  }, [startPayment, createJoiningPayload, loggedInUser, navigation, paymentLoading]);

  const isLoading = paymentLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <PremiumBackground />
      <CommonHeader title="Member Creation" showBack onBackPress={handleBack} transparent borderBottom={false} shadow={false} />

      <View style={styles.scrollView}>
        <SchemeJoiningForm
          ref={schemeFormRef}
          scheme={scheme}
          initialData={schemeJoiningData}
          onAmountChange={setPayableAmount}
        />
      </View>

      {/* Razorpay Checkout WebView */}
      {/* Payment Status Modal */}
      <PaymentModal
        visible={paymentStep === PAYMENT_STEPS.CREATING_ORDER || paymentStep === PAYMENT_STEPS.VERIFYING}
        step={paymentStep}
        error={paymentError}
      />

      {/* Loading Overlay */}
      {isLoading && paymentStep === PAYMENT_STEPS.IDLE && (
        <LoadingOverlay message="Processing..." />
      )}

      <NavigationButtons onSubmit={handleSubmit} isLoading={isLoading} payableAmount={payableAmount} />
    </KeyboardAvoidingView>
  );
};

const LoadingOverlay = ({ message }: { message: string }) => (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator size="large" color={COLORS.contentOnInverse} />
    <AppText variant="bodyBold" color={COLORS.contentOnBrand} style={{ marginTop: SIZES.space.sm }}>
      {message}
    </AppText>
  </View>
);

interface NavigationButtonsProps {
  onSubmit: () => void;
  isLoading: boolean;
  payableAmount?: number | null;
}

const formatINR = (value: number): string => {
  try {
    return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  } catch {
    return String(value);
  }
};

const NavigationButtons = ({ onSubmit, isLoading, payableAmount }: NavigationButtonsProps) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = { paddingBottom: Math.max(insets.bottom, SIZES.space.md) };

    return (
      <View style={[styles.navigationContainer, bottomPadding]}>
        <View style={styles.payableBlock}>
          <AppText variant="caption" color={COLORS.contentMuted}>
            Total payable
          </AppText>
          <AppText variant="h4" color={payableAmount ? COLORS.contentBrand : COLORS.contentDisabled} numberOfLines={1}>
            ₹{payableAmount ? formatINR(payableAmount) : '0'}
          </AppText>
        </View>
        <AppButton
          label="Pay Now"
          variant="primary"
          size="lg"
          rightIcon="arrow-forward"
          onPress={onSubmit}
          loading={isLoading}
          disabled={isLoading || !payableAmount}
          fullWidth={false}
          style={styles.payButton}
        />
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
  },
  scrollView: {
    flex: 1,
  },
  controlLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.space.gutter,
  },
  stepIndicator: {
    backgroundColor: COLORS.surface,
    paddingVertical: SIZES.space.lg,
    paddingHorizontal: SIZES.space.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...ELEVATION.raised,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.space.sm,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: COLORS.brand,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SIZES.space.sm,
  },
  activeStepLine: {
    backgroundColor: COLORS.brand,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.space.sm,
  },
  stepLabelFlex: {
    flex: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SIZES.space.md,
    paddingHorizontal: SIZES.space.lg,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.radius.xl,
    borderTopRightRadius: SIZES.radius.xl,
    gap: SIZES.space.lg,
    ...ELEVATION.overlay,
  },
  payableBlock: {
    flex: 1,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.space.xs,
    paddingHorizontal: SIZES.space.sm,
  },
  payButton: {
    flex: 1.3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.scrimHeavy,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default MemberCreation;
