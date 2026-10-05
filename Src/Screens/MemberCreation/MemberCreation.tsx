// Src/Screens/MemberCreation/MemberCreation.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UserRegistrationForm, { UserRegistrationFormData, UserRegistrationFormRef } from './UserRegistrationForm';
import SchemeJoiningForm, { SchemeJoiningFormRef } from './SchemeJoiningForm';
import { useRazorpayPayment } from '../../api/hooks/Razorpay/useRazorpay';
import PaymentModal, { SuccessDetails } from './PaymentModal';
import { DEFAULT_EMPLOYEE_ID } from './EmployeePickerModal';
import RazorpayWebView from '../../Components/RazorpayWebView';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../Components/PremiumBackground/PremiumBackground';
import { getUserData, getUserId, getUserField } from '../../Utills/AsynchStorageHelper';
import { useTransactionTypes } from '../../api/hooks/Account/useTransactionTypes';
import { Scheme } from '../../types/Scheme/Scheme';
import { CreateMemberPayload } from '../../types/Member/Member';
import { AppButton, AppText } from '../../Components/ui/appcomponents';
import theme from '../../Utills/AppTheme';
import { PAYMENT_CONSTANTS } from '../../constants/paymentConstants';
import { requiresKycFromControls, softControlService } from '../../api/services/softControlService';

const { COLORS, SIZES, FONTS, ELEVATION } = theme;

// Constants
const STEPS = {
  REGISTRATION: 1,
  SCHEME_JOINING: 2,
} as const;

type Step = (typeof STEPS)[keyof typeof STEPS];

type MemberCreationRouteParams = { scheme?: Scheme; requiresKyc?: boolean } | undefined;

const MemberCreation = () => {
  const route = useRoute<RouteProp<Record<string, MemberCreationRouteParams>, string>>();
  const navigation = useNavigation<any>();
  const { scheme, requiresKyc: routeRequiresKyc } = route.params || {};
  const hasResolvedKycRoute = typeof routeRequiresKyc === 'boolean';

  // State
  const [currentStep, setCurrentStep] = useState<Step>(STEPS.REGISTRATION);
  const [userRegistrationData, setUserRegistrationData] = useState<Partial<UserRegistrationFormData>>({});
  const [schemeJoiningData] = useState(null);
  const [currentUserId, setCurrentUserId] = useState<string | number | null>(null);
  const [currentReferralCode, setCurrentReferralCode] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<Record<string, any>>({});
  // Until the server control resolves, keep the safer flow that collects KYC.
  const [requiresKyc, setRequiresKyc] = useState(routeRequiresKyc ?? true);
  const [kycControlLoading, setKycControlLoading] = useState(!hasResolvedKycRoute);

  const [successDetails, setSuccessDetails] = useState<SuccessDetails | null>(null);
  const [payableAmount, setPayableAmount] = useState<number | null>(null);

  // Refs
  const registrationFormRef = useRef<UserRegistrationFormRef>(null);
  const schemeFormRef = useRef<SchemeJoiningFormRef>(null);

  // Hooks
  const { onlinePayMode } = useTransactionTypes();

  const {
    loading: paymentLoading,
    startPayment,
    paymentStep,
    error: paymentError,
    resetState: resetPayment,
    PAYMENT_STEPS,
    webViewVisible,
    razorpayOptions,
    handlePaymentSuccess,
    handlePaymentDismiss,
  } = useRazorpayPayment();

  // Reset state on screen focus — but ONLY when not mid-payment.
  // If the user switches to a UPI app and comes back, useFocusEffect fires
  // again and was resetting the entire payment state while the WebView was
  // still open, killing the in-flight payment.
  useFocusEffect(
    useCallback(() => {
      if (!webViewVisible && paymentStep === PAYMENT_STEPS.IDLE) {
        resetForm();
      }
    }, [webViewVisible, paymentStep, requiresKyc])
  );

  // Load the logged-in user's details once for the KYC-skipped payload.
  useEffect(() => {
    (async () => {
      try {
        const [uid, refCode, storedUser] = await Promise.all([
          getUserId(),
          getUserField('referralCode'),
          getUserData(),
        ]);
        if (uid) setCurrentUserId(uid);
        if (refCode) setCurrentReferralCode(refCode);
        if (storedUser) setLoggedInUser(storedUser);
      } catch (e) {
        console.log('Failed to load logged-in user details', e);
      }
    })();
  }, []);

  // ctlText "1" requires the full KYC form. A value of "2" or greater
  // starts directly on scheme/amount selection and uses the signed-in user.
  useEffect(() => {
    if (hasResolvedKycRoute) {
      setRequiresKyc(routeRequiresKyc);
      setCurrentStep(routeRequiresKyc ? STEPS.REGISTRATION : STEPS.SCHEME_JOINING);
      setKycControlLoading(false);
      return;
    }

    let active = true;

    (async () => {
      try {
        const controls = await softControlService.getKycUpdation();
        const shouldRequireKyc = requiresKycFromControls(controls);

        if (active) {
          setRequiresKyc(shouldRequireKyc);
          setCurrentStep(shouldRequireKyc ? STEPS.REGISTRATION : STEPS.SCHEME_JOINING);
        }
      } catch (error) {
        // A failed control fetch must never accidentally bypass KYC.
        console.log('Failed to load KYC soft control; using KYC flow', error);
        if (active) setRequiresKyc(true);
      } finally {
        if (active) setKycControlLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [hasResolvedKycRoute, routeRequiresKyc]);

  const resetForm = () => {
    setCurrentStep(requiresKyc ? STEPS.REGISTRATION : STEPS.SCHEME_JOINING);
    setUserRegistrationData({});
    resetPayment();
  };

  const handleRegistrationSubmit = useCallback((formData: UserRegistrationFormData) => {
    console.log('[SCHEME JOIN] STEP 1 — User registration form submitted', { name: formData.userName, mobile: formData.mobileNumber });
    setUserRegistrationData(formData);
    setCurrentStep(STEPS.SCHEME_JOINING);
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep === STEPS.SCHEME_JOINING && requiresKyc) {
      setCurrentStep(STEPS.REGISTRATION);
    } else {
      navigation.goBack();
    }
  }, [currentStep, navigation, requiresKyc]);

  const handleNext = useCallback(() => {
    if (currentStep === STEPS.REGISTRATION && registrationFormRef.current) {
      registrationFormRef.current.validateAndSubmit();
    }
  }, [currentStep]);

  const formatDate = useCallback((dateStr?: string | null): string | null => {
    if (!dateStr) return null;

    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // If in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('-');
      return `${year}-${month}-${day}`;
    }

    // Fallback (handles Date objects or other formats)
    const date = new Date(dateStr);
    if (!isNaN(date as any)) {
      return date.toISOString().split('T')[0];
    }

    return null;
  }, []);

  const createMemberPayload = useCallback(
    (formData: any, regNo: number): CreateMemberPayload => {
      const user = userRegistrationData;
      const aadhaar = user.aadharNumber?.replace(/\s/g, '') || '';
      const maskedAadhaar = aadhaar.length >= 4 ? `XXXX-XXXX-${aadhaar.slice(-4)}` : '';
      const nowDateTime = new Date().toISOString().slice(0, 10) + ' 00:00:00';

      return {
        newMember: {
          title: PAYMENT_CONSTANTS.TITLE,
          initial: (user.userName?.[0] || PAYMENT_CONSTANTS.INITIAL_FALLBACK).toUpperCase(),
          pName: user.userName || 'NA',
          sName: user.lastName || 'NA',
          doorNo: user.doorNo || '',
          address1: user.street || '',
          address2: '',
          area: user.area || '',
          city: user.city || '',
          state: (user.state || PAYMENT_CONSTANTS.DEFAULT_STATE).replace(/\s+/g, ' '),
          country: PAYMENT_CONSTANTS.DEFAULT_COUNTRY,
          pinCode: user.pincode || '',
          mobile: user.mobileNumber || '',
          mobile2: user.nomineeMobile || '',
          nomeni: user.nomineeName || '',
          nomineeMobile: user.nomineeMobile || '',
          nomineeRelationship: user.nomineeRelationship || '',
          nomAddr1: user.street || '',
          nomAddr2: '',
          nomCity: user.city || '',
          nomState: (user.state || PAYMENT_CONSTANTS.DEFAULT_STATE).replace(/\s+/g, ' '),
          nomPincode: user.pincode || '',
          nomCountry: PAYMENT_CONSTANTS.DEFAULT_COUNTRY,
          idProof: PAYMENT_CONSTANTS.ID_PROOF,
          idProofNo: aadhaar,
          aadhaarMasked: maskedAadhaar,
          // Backend NewMember model calls this field "panno", not "panNumber" —
          // sending the wrong key throws a Jackson UnrecognizedPropertyException
          // and silently kills the entire member creation (caught only inside
          // processPendingPayment's error handling on the backend).
          panno: user.panNumber || '',
          dob: formatDate(user.dob),
          email: user.emailAddress || '',
          // mobileVerified/aadhaarVerified deliberately omitted — the backend's
          // NewMember model has no such fields for the primary member (only
          // nomineeMobileVerified/nomineeAadhaarVerified exist), so sending them
          // causes the same unrecognized-field failure as panNumber did.
          nomineeMobileVerified: true,
          nomineeAadhaarVerified: false,
          upDateTime: nowDateTime,
          userId: PAYMENT_CONSTANTS.USER_ID,
          appVer: PAYMENT_CONSTANTS.APP_VER,
          anniversaryDate: formatDate(user.anniversaryDate),
        },
        createSchemeSummary: {
          schemeId: formData.schemeId || 0,
          groupCode: formData.selectedScheme || '',
          regNo,
          joinDate: nowDateTime,
          // Backend CreateSchemeSummary model calls these "updateTime"/"userId",
          // not "upDateTime2"/"userId2" — same unrecognized-field failure mode.
          updateTime: nowDateTime,
          openingDate: nowDateTime,
          userId: PAYMENT_CONSTANTS.USER_ID,
          iEmp: formData.employeeId || DEFAULT_EMPLOYEE_ID,
        },
        schemeCollectInsert: {
          amount: formData.amount || 0,
          modePay: onlinePayMode?.modePay ?? 'R',
          accCode: onlinePayMode?.accCode ?? '',
          chqBankCode: onlinePayMode?.chqBankCode ?? 4,
          // Payment/order id aren't known yet — this payload is built and
          // parked server-side BEFORE the Razorpay order (and therefore the
          // payment id) exists.
          chqCardNo: '',
          chqBranch: PAYMENT_CONSTANTS.CHQ_BRANCH,
          chkBank: PAYMENT_CONSTANTS.CHK_BANK,
          chqRtnReason: '',
        },
        ...(currentReferralCode ? { referralCode: currentReferralCode } : {}),
      };
    },
    [userRegistrationData, formatDate, currentReferralCode]
  );

  /** Minimal NMDATA used when the soft control says KYC has already been collected. */
  const createKycSkippedPayload = useCallback(
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

  // The backend returns the parked-payload outcome as a stringified map,
  // e.g. "PROCESSED: {status=Success, personalId=123, regNo=45, ...}" once
  // the member has actually been created (either via this /verify-payment
  // call, or — if the webhook beat it to it — already done by the time we
  // ask). Parse that instead of calling member/create ourselves.
  const showMemberCreatedAlert = useCallback(
    (formData: any, processResult?: string) => {
      const msgStr = (processResult || '').replace(/^PROCESSED:\s*/, '');

      if (!msgStr) {
        setSuccessDetails({ schemeName: formData.schemeName || 'the scheme' });
        return;
      }

      const parsed: Record<string, string> = {};
      msgStr
        .replace(/[{}]/g, '')
        .split(', ')
        .forEach((pair: string) => {
          const [key, ...rest] = pair.split('=');
          if (key) parsed[key.trim()] = rest.join('=').trim();
        });

      setSuccessDetails({
        personalId: parsed.personalId,
        regNo: parsed.regNo,
        groupCode: parsed.groupCode,
        schemeName: formData.schemeName,
        amount: parsed.amount || String(formData.amount || 0),
        sno: parsed.sno,
      });
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    // Guard: prevent double-tap / re-entry while payment is already in flight
    if (paymentLoading) return;
    if (currentStep !== STEPS.SCHEME_JOINING || !schemeFormRef.current) return;

    const isValid = schemeFormRef.current.validateAndSubmit();
    if (!isValid) return;

    const formData = schemeFormRef.current.getFormData();
    const regNo = formData.regNo;
    const groupCode = formData.selectedScheme || 'MAN';

    console.log('[SCHEME JOIN] STEP 2 — Scheme joining form submitted', { scheme: formData.schemeName, groupCode, amount: formData.amount });

    // Built up front and sent as NMDATA on create-order (NEWJOIN=true) —
    // the backend parks it and creates the member automatically once
    // payment is confirmed. There's no more separate member/create call.
    const nmData = requiresKyc ? createMemberPayload(formData, regNo) : createKycSkippedPayload(formData);
    console.log('[SCHEME JOIN] STEP 2 — Member payload built (NMDATA)', { pName: nmData.newMember.pName, schemeId: nmData.createSchemeSummary.schemeId });

    console.log('[SCHEME JOIN] STEP 2 — Payment request payload', {
      amount: formData.amount || 0,
      regNo,
      groupCode,
      requiresKyc,
      userDetails: {
        name: requiresKyc ? userRegistrationData.userName : (loggedInUser?.customerName || loggedInUser?.username || loggedInUser?.name),
        phone: requiresKyc ? userRegistrationData.mobileNumber : (loggedInUser?.contactNumber || loggedInUser?.mobileNumber || loggedInUser?.mobile || loggedInUser?.phone),
        email: requiresKyc ? userRegistrationData.emailAddress : loggedInUser?.email,
      },
      nmData,
    });

    const result = await startPayment(
      formData.amount || 0,
      {
        name: requiresKyc ? userRegistrationData.userName : (loggedInUser?.customerName || loggedInUser?.username || loggedInUser?.name),
        phone: requiresKyc ? userRegistrationData.mobileNumber : (loggedInUser?.contactNumber || loggedInUser?.mobileNumber || loggedInUser?.mobile || loggedInUser?.phone),
        email: requiresKyc ? userRegistrationData.emailAddress : loggedInUser?.email,
      },
      regNo,
      groupCode,
      { newJoin: true, nmData }
    );

    if (result.success) {
      console.log('[SCHEME JOIN] STEP 8 — Flow complete. Showing success alert.', { processResult: result.processResult });
      showMemberCreatedAlert(formData, result.processResult);
    } else if (result.message !== 'Payment cancelled by user') {
      console.log('[SCHEME JOIN] FLOW FAILED —', result.message);
      Alert.alert('Payment Failed', result.message || 'Payment failed');
    }
  }, [currentStep, userRegistrationData, startPayment, createMemberPayload, createKycSkippedPayload, loggedInUser, requiresKyc, showMemberCreatedAlert]);

  const isLoading = paymentLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <PremiumBackground />
      <CommonHeader title="Member Creation" showBack onBackPress={handleBack} transparent borderBottom={false} shadow={false} />

      {/* Step Indicator */}
      {/* <StepIndicator currentStep={currentStep} /> */}

        <View style={styles.scrollView}>
        {kycControlLoading ? (
          <View style={styles.controlLoading}>
            <ActivityIndicator size="large" color={COLORS.contentBrand} />
            <AppText variant="body" color={COLORS.contentSecondary} style={{ marginTop: SIZES.space.md }}>
              Preparing your scheme application...
            </AppText>
          </View>
        ) : currentStep === STEPS.REGISTRATION ? (
          <UserRegistrationForm ref={registrationFormRef} onSubmit={handleRegistrationSubmit} initialData={userRegistrationData} />
        ) : (
          <SchemeJoiningForm
            ref={schemeFormRef}
            scheme={scheme}
            initialData={schemeJoiningData}
            onAmountChange={setPayableAmount}
            userData={requiresKyc ? userRegistrationData : {
              userName: loggedInUser?.customerName || loggedInUser?.username || loggedInUser?.name,
              mobileNumber: loggedInUser?.contactNumber || loggedInUser?.mobileNumber || loggedInUser?.mobile || loggedInUser?.phone,
              emailAddress: loggedInUser?.email,
            }}
          />
        )}
      </View>

      {/* Razorpay Checkout WebView */}
      <RazorpayWebView visible={webViewVisible} options={razorpayOptions} onSuccess={handlePaymentSuccess} onDismiss={handlePaymentDismiss} />

      {/* Payment Status Modal */}
      <PaymentModal
        visible={paymentStep === PAYMENT_STEPS.CREATING_ORDER || paymentStep === PAYMENT_STEPS.VERIFYING || !!successDetails}
        step={successDetails ? 'success' : paymentStep}
        error={paymentError}
        successDetails={successDetails}
        onSuccessClose={() => { setSuccessDetails(null); navigation.navigate('MainDrawer'); }}
      />

      {/* Loading Overlay */}
      {isLoading && paymentStep === PAYMENT_STEPS.IDLE && (
        <LoadingOverlay message="Processing..." />
      )}

      {/* Navigation Buttons */}
      {!kycControlLoading && (
        <NavigationButtons
          currentStep={currentStep}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          payableAmount={payableAmount}
        />
      )}
    </KeyboardAvoidingView>
  );
};

// Sub-components for better organization
// const StepIndicator = ({ currentStep }: { currentStep: Step }) => (
//   <View style={styles.stepIndicator}>
//     <View style={styles.stepRow}>
//       {[1, 2].map((step) => (
//         <React.Fragment key={step}>
//           <View style={[styles.stepCircle, currentStep >= step && styles.activeStep]}>
//             <AppText variant="bodyBold" color={currentStep >= step ? COLORS.surface : COLORS.contentSecondary}>
//               {step}
//             </AppText>
//           </View>
//           {step === 1 && <View style={[styles.stepLine, currentStep >= 2 && styles.activeStepLine]} />}
//         </React.Fragment>
//       ))}
//     </View>
//     <View style={styles.stepLabels}>
//       <AppText variant="caption" color={currentStep >= 1 ? COLORS.accent : COLORS.contentSecondary} align="center" style={styles.stepLabelFlex}>
//         Registration
//       </AppText>
//       <AppText variant="caption" color={currentStep >= 2 ? COLORS.accent : COLORS.contentSecondary} align="center" style={styles.stepLabelFlex}>
//         Scheme Joining
//       </AppText>
//     </View>
//   </View>
// );

const LoadingOverlay = ({ message }: { message: string }) => (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator size="large" color={COLORS.contentOnInverse} />
    <AppText variant="bodyBold" color={COLORS.contentOnBrand} style={{ marginTop: SIZES.space.sm }}>
      {message}
    </AppText>
  </View>
);

interface NavigationButtonsProps {
  currentStep: Step;
  onBack: () => void;
  onNext: () => void;
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

const NavigationButtons = ({ currentStep, onBack, onNext, onSubmit, isLoading, payableAmount }: NavigationButtonsProps) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = { paddingBottom: Math.max(insets.bottom, SIZES.space.md) };

  if (currentStep === STEPS.SCHEME_JOINING) {
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
  }

  return (
    <View style={[styles.navigationContainer, bottomPadding]}>
      <TouchableOpacity onPress={onBack} disabled={isLoading} style={styles.cancelButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="close" size={SIZES.icon.sm} color={COLORS.contentSecondary} />
        <AppText variant="bodyMedium" color={COLORS.contentSecondary}>
          Cancel
        </AppText>
      </TouchableOpacity>
      <AppButton
        label="Continue"
        variant="primary"
        size="lg"
        rightIcon="arrow-forward"
        onPress={onNext}
        disabled={isLoading}
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
