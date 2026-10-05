// Src/Screens/PayNow/PayNow.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Modal, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useRazorpayPayment } from '../../api/hooks/Razorpay/useRazorpay';
import { useTransactionTypes } from '../../api/hooks/Account/useTransactionTypes';
import RazorpayWebView from '../../Components/RazorpayWebView';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../Components/PremiumBackground/PremiumBackground';
import { AppCard, AppText, AppButton, AppBadge, AppDivider, AppInput, ScreenWrapper } from '../../Components/ui/appcomponents';
import theme from '../../Utills/AppTheme';
import { PAYMENT_CONSTANTS } from '../../constants/paymentConstants';
import { MemberDetailsPayload, memberKycService } from '../../api/services/memberKycService';

const { COLORS, SIZES } = theme;

const STATUS = { IDLE: 'idle', SUCCESS: 'success', FAILED: 'failed' } as const;
type Status = (typeof STATUS)[keyof typeof STATUS];
type KycCheckState = 'loading' | 'ready' | 'incomplete' | 'error';

const createMemberDetailsDraft = (accountData: any): MemberDetailsPayload => {
  const personalInfo = accountData?.personalInfo || {};

  return {
    doorNo: personalInfo.doorNo || '',
    address1: personalInfo.address1 || '',
    area: personalInfo.area || '',
    city: personalInfo.city || '',
    state: personalInfo.state || '',
    country: personalInfo.country || 'India',
    pinCode: personalInfo.pinCode || '',
    email: personalInfo.email || accountData?.email || '',
    dob: personalInfo.dob || '',
    maritalStatus: personalInfo.maritalStatus || '',
    anniversaryDate: personalInfo.anniversaryDate || '',
    idProof: personalInfo.idProof || 'AADHAAR',
    idProofNo: personalInfo.idProofNo || '',
    aadhaarMasked: personalInfo.aadhaarMasked || '',
    nomeni: personalInfo.nomeni || '',
    nomineeMobile: personalInfo.nomineeMobile || personalInfo.mobile2 || '',
    nomineeRelationship: personalInfo.nomineeRelationship || '',
  };
};

export interface PayNowRouteParams {
  accountData?: any;
  regNo?: string | number;
  groupCode?: string;
  memberName?: string;
  schemeName?: string;
  schemeShortName?: string;
  amount?: number | string;
  totalAmount?: number | string;
  installmentsPaid?: number | string;
  totalInstallments?: number | string;
  joinDate?: string;
  maturityDate?: string;
  nextDueDate?: string;
  schemeId?: number | string;
}

const PayNow = () => {
  const route = useRoute<RouteProp<Record<string, PayNowRouteParams>, string>>();
  const navigation = useNavigation<any>();
  const {
    accountData,
    regNo,
    groupCode,
    memberName,
    schemeName,
    schemeShortName,
    amount,
    totalAmount,
    installmentsPaid,
    totalInstallments,
    joinDate,
    maturityDate,
    nextDueDate,
    schemeId,
  } = route.params || {};

  const [status, setStatus] = useState<Status>(STATUS.IDLE);
  const [statusMsg, setStatusMsg] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const personalId = useMemo(
    () => String(accountData?.personalInfo?.personalId ?? accountData?.personalId ?? '').trim(),
    [accountData]
  );
  const [kycCheckState, setKycCheckState] = useState<KycCheckState>('loading');
  const [kycError, setKycError] = useState('');
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [showKycForm, setShowKycForm] = useState(false);
  const [savingKycDetails, setSavingKycDetails] = useState(false);
  const [kycDetails, setKycDetails] = useState<MemberDetailsPayload>(() => createMemberDetailsDraft(accountData));

  const { onlinePayMode } = useTransactionTypes();

  const {
    loading: paymentLoading,
    startPayment,
    resetState: resetPayment,
    webViewVisible,
    razorpayOptions,
    handlePaymentSuccess,
    handlePaymentDismiss,
  } = useRazorpayPayment();

  const formatCurrency = useCallback((value: unknown) => {
    const n = parseFloat(String(value)) || 0;
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }, []);

  const formatDate = useCallback((d?: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  const paymentAmount = useMemo(() => parseFloat(String(amount)) || 0, [amount]);
  const nextInstallment = useMemo(() => (parseInt(String(installmentsPaid), 10) || 0) + 1, [installmentsPaid]);
  const progress = useMemo(() => {
    const paid = parseInt(String(installmentsPaid), 10) || 0;
    const total = parseInt(String(totalInstallments), 10) || 1;
    return (paid / total) * 100;
  }, [installmentsPaid, totalInstallments]);

  const formatApiDate = (date: Date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d} 00:00:00`;
  };

  const checkKycStatus = useCallback(async () => {
    if (!personalId) {
      setKycCheckState('error');
      setKycError('Member ID is unavailable. Please return to your scheme and try again.');
      return;
    }

    setKycCheckState('loading');
    setKycError('');

    try {
      const response = await memberKycService.getKycStatus(personalId);
      const isKycComplete = String(response?.KYCUPDATION || '').trim().toUpperCase() === 'N';

      if (isKycComplete) {
        setKycCheckState('ready');
        setKycModalVisible(false);
        setShowKycForm(false);
      } else {
        setKycCheckState('incomplete');
        setKycModalVisible(true);
      }
    } catch (error: any) {
      setKycCheckState('error');
      setKycError(error?.message || 'Unable to verify your KYC status. Please try again.');
    }
  }, [personalId]);

  useEffect(() => {
    setKycDetails(createMemberDetailsDraft(accountData));
  }, [accountData]);

  useEffect(() => {
    checkKycStatus();
  }, [checkKycStatus]);

  const updateKycDetail = useCallback((field: keyof MemberDetailsPayload, value: string) => {
    setKycDetails((previous) => ({ ...previous, [field]: value }));
  }, []);

  const saveKycDetails = useCallback(async () => {
    if (savingKycDetails || !personalId) return;

    if (!kycDetails.doorNo || !kycDetails.address1 || !kycDetails.city || !kycDetails.state || !kycDetails.pinCode || !kycDetails.email) {
      Alert.alert('Complete KYC', 'Please fill your address, city, state, PIN code, and email before continuing.');
      return;
    }

    setSavingKycDetails(true);
    try {
      await memberKycService.updateDetails(personalId, kycDetails);
      await checkKycStatus();
      Alert.alert('KYC Details Updated', 'Your details were submitted. You can continue to payment once KYC is approved.');
    } catch (error: any) {
      Alert.alert('Unable to Update KYC', error?.message || 'Please try again.');
    } finally {
      setSavingKycDetails(false);
    }
  }, [checkKycStatus, kycDetails, personalId, savingKycDetails]);

  const handlePayment = useCallback(async () => {
    if (paymentLoading) return;
    if (kycCheckState !== 'ready') {
      setKycModalVisible(kycCheckState === 'incomplete');
      if (kycCheckState === 'error') {
        Alert.alert('KYC Verification Required', kycError || 'Please verify your KYC status before payment.');
      }
      return;
    }
    setStatus(STATUS.IDLE);
    setStatusMsg('');
    resetPayment();

    // Built up front — the backend parks this against the Razorpay order
    // the moment create-order is called, and only inserts it as a real
    // installment once payment is confirmed (verify-payment or webhook).
    // Note: the Razorpay payment/order id isn't known yet at this point
    // (the order doesn't exist until create-order returns), so chqCardNo /
    // chqRtnReason can't carry that reference the way the old pre-payment
    // flow did.
    const today = formatApiDate();
    const installmentPayload = {
      groupCode: groupCode || '',
      regNo: parseInt(String(regNo), 10) || 0,
      rDate: today,
      amount: paymentAmount,
      modePay: onlinePayMode?.modePay ?? 'R',
      accCode: onlinePayMode?.accCode ?? '',
      updateTime: today,
      installment: nextInstallment,
      weight:
        accountData?.schemeSummary?.weightLedger === 'Y' ? parseFloat(accountData?.schemeSummary?.totalWeight || 0) : 0,
      sWeight:
        accountData?.schemeSummary?.weightLedger === 'Y' ? parseFloat(accountData?.schemeSummary?.lastWeight || 0) : 0,
      userID: PAYMENT_CONSTANTS.USER_ID,
      schemeId: parseInt(String(schemeId), 10) || 0,
      chqBankCode: onlinePayMode?.chqBankCode ?? 4,
      chqCardNo: '',
      chqBranch: PAYMENT_CONSTANTS.CHQ_BRANCH,
      chkBank: PAYMENT_CONSTANTS.CHK_BANK,
      chqRtnReason: '',
    };

    const result = await startPayment(
      paymentAmount,
      {
        name: memberName || 'Customer',
        phone: accountData?.personalInfo?.mobile || PAYMENT_CONSTANTS.FALLBACK_PHONE,
        email: accountData?.personalInfo?.email || PAYMENT_CONSTANTS.FALLBACK_EMAIL,
      },
      regNo?.toString() || '1',
      groupCode || 'MAN',
      { newJoin: false, schemeDetails: installmentPayload }
    );

    if (result.success) {
      setPaymentId(result.paymentId || '');
      setStatus(STATUS.SUCCESS);
      resetPayment();
    } else if (result.message !== 'Payment cancelled by user') {
      setStatusMsg(result.message || 'Payment failed. Please try again.');
      setStatus(STATUS.FAILED);
      resetPayment();
    }
  }, [paymentLoading, kycCheckState, kycError, paymentAmount, memberName, accountData, regNo, groupCode, startPayment, nextInstallment, schemeId, resetPayment]);

  const isLoading = paymentLoading;

  if (kycCheckState === 'loading') {
    return (
      <ScreenWrapper header={<CommonHeader title="Pay Now" />}>
        <View style={styles.kycStateContainer}>
          <ActivityIndicator size="large" color={COLORS.contentBrand} />
          <AppText variant="body" color={COLORS.contentSecondary} align="center" style={styles.kycStateText}>
            Verifying your KYC status...
          </AppText>
        </View>
      </ScreenWrapper>
    );
  }

  if (kycCheckState === 'error') {
    return (
      <ScreenWrapper header={<CommonHeader title="Pay Now" />}>
        <View style={styles.kycStateContainer}>
          <AppText variant="h4" align="center">Unable to verify KYC</AppText>
          <AppText variant="body" color={COLORS.contentSecondary} align="center" style={styles.kycStateText}>
            {kycError}
          </AppText>
          <AppButton label="Try Again" size="lg" onPress={checkKycStatus} />
          <AppButton label="Go Back" variant="outline" size="lg" style={styles.kycBackButton} onPress={() => navigation.goBack()} />
        </View>
      </ScreenWrapper>
    );
  }

  if (status === STATUS.SUCCESS) {
    return (
      <ScreenWrapper header={<CommonHeader title="Payment" />}>
        <View style={styles.statusContainer}>
          <AppText style={styles.statusIcon}>✅</AppText>
          <AppText variant="h2" align="center" style={styles.statusSpacing}>
            Payment Successful!
          </AppText>
          <AppText variant="body" color={COLORS.contentSecondary} align="center" style={styles.statusSpacing}>
            {formatCurrency(paymentAmount)} paid successfully
          </AppText>
          <AppText variant="bodyBold" color={COLORS.contentBrand} style={styles.statusDetail}>
            Installment {nextInstallment}/{totalInstallments}
          </AppText>
          {paymentId ? (
            <AppText variant="caption" style={styles.paymentIdText}>
              ID: {paymentId}
            </AppText>
          ) : null}
          <AppButton
            label="View Scheme"
            size="lg"
            style={styles.actionBtn}
            onPress={() => navigation.navigate('AllSchemes', { schemeData: accountData, fromScreen: 'PayNow' })}
          />
          <AppButton label="Go Back" variant="outline" size="lg" onPress={() => navigation.goBack()} />
        </View>
      </ScreenWrapper>
    );
  }

  if (status === STATUS.FAILED) {
    return (
      <ScreenWrapper header={<CommonHeader title="Payment" />}>
        <View style={styles.statusContainer}>
          <AppText style={styles.statusIcon}>❌</AppText>
          <AppText variant="h2" align="center" style={styles.statusSpacing}>
            Payment Failed
          </AppText>
          <AppText variant="body" color={COLORS.contentSecondary} align="center" style={styles.statusSpacing}>
            {statusMsg || 'Something went wrong. Please try again.'}
          </AppText>
          <AppButton label="Try Again" size="lg" style={styles.actionBtn} onPress={() => setStatus(STATUS.IDLE)} />
          <AppButton label="Go Back" variant="outline" size="lg" onPress={() => navigation.goBack()} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <View style={styles.container}>
      <PremiumBackground />
      <CommonHeader title="Pay Now" transparent borderBottom={false} shadow={false} />

      {/* <ScreenWrapper scroll backgroundColor="transparent" contentStyle={styles.scrollContent}> */}
        {/* Scheme Card */}
        <AppCard style={styles.card}>
          <View style={styles.badgeRow}>
            <AppBadge label={schemeShortName || 'SCHEME'} variant="primary" />
            <AppBadge label={`REG: ${regNo}`} variant="neutral" />
          </View>
          <AppText variant="h3" style={styles.memberName}>
            {memberName}
          </AppText>
          <AppText variant="body" color={COLORS.contentSecondary} numberOfLines={2} style={styles.schemeName}>
            {schemeName}
          </AppText>

          <AppDivider />

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <AppText variant="bodySmall" color={COLORS.contentSecondary} style={styles.progressText}>
            {installmentsPaid}/{totalInstallments} Installments Paid
          </AppText>

          <View style={styles.nextBadge}>
            <AppText variant="bodyMedium" color={COLORS.contentBrand}>
              Next Installment: #{nextInstallment}
            </AppText>
          </View>

          <View style={styles.dateRow}>
            <View>
              <AppText variant="caption">Join Date</AppText>
              <AppText variant="bodyBold">{formatDate(joinDate)}</AppText>
            </View>
            <View>
              <AppText variant="caption">Maturity Date</AppText>
              <AppText variant="bodyBold">{formatDate(maturityDate)}</AppText>
            </View>
          </View>

          {nextDueDate && (
            <View style={styles.dueBadge}>
              <AppText variant="bodyMedium" color={COLORS.contentBrand}>
                Next Due: {formatDate(nextDueDate)}
              </AppText>
            </View>
          )}
        </AppCard>

        {/* Summary Card */}
        <AppCard style={styles.card}>
          <AppText variant="h5" style={styles.sectionTitle}>
            Payment Summary
          </AppText>
          <View style={styles.row}>
            <AppText color={COLORS.contentSecondary}>Installment Amount</AppText>
            <AppText variant="bodyBold">{formatCurrency(amount)}</AppText>
          </View>
          <View style={styles.row}>
            <AppText color={COLORS.contentSecondary}>Total Paid Till Date</AppText>
            <AppText variant="bodyBold">{formatCurrency(totalAmount)}</AppText>
          </View>
          <AppDivider />
          <View style={styles.row}>
            <AppText variant="h6">Due Amount</AppText>
            <AppText variant="h4" color={COLORS.contentBrand}>
              {formatCurrency(paymentAmount)}
            </AppText>
          </View>
        </AppCard>

        {/* Payment Method Card */}
        <AppCard style={styles.card}>
          <AppText variant="h5" style={styles.sectionTitle}>
            Payment Method
          </AppText>
          <View style={styles.methodRow}>
            <AppText style={styles.methodIcon}>💰</AppText>
            <View style={styles.methodInfo}>
              <AppText variant="h6">Razorpay</AppText>
              <AppText variant="bodySmall" color={COLORS.contentSecondary}>
                UPI, Card, NetBanking, Wallet
              </AppText>
            </View>
            <AppBadge label="Selected" variant="primary" />
          </View>
          <View style={styles.secureRow}>
            <AppText>🔒 </AppText>
            <AppText variant="bodySmall" color={COLORS.contentSecondary} style={styles.secureText}>
              Secure payment powered by Razorpay
            </AppText>
          </View>
        </AppCard>

        <View style={{ height: 100 }} />
      {/* </ScreenWrapper> */}

      <RazorpayWebView visible={webViewVisible} options={razorpayOptions} onSuccess={handlePaymentSuccess} onDismiss={handlePaymentDismiss} />

      <Modal visible={kycModalVisible} transparent animationType="slide" onRequestClose={() => undefined}>
        <View style={styles.kycModalOverlay}>
          <View style={styles.kycModalCard}>
            {!showKycForm ? (
              <>
                <AppText variant="h4" align="center">KYC not completed</AppText>
                <AppText variant="body" color={COLORS.contentSecondary} align="center" style={styles.kycModalMessage}>
                  Complete your KYC details before paying this installment.
                </AppText>
                <AppButton label="Complete KYC" size="lg" onPress={() => setShowKycForm(true)} />
                <AppButton label="Check KYC Again" variant="outline" size="md" style={styles.kycSecondaryButton} onPress={checkKycStatus} />
              </>
            ) : (
              <>
                <AppText variant="h4" align="center">Complete KYC Details</AppText>
                <AppText variant="bodySmall" color={COLORS.contentSecondary} align="center" style={styles.kycModalMessage}>
                  Update the information below. Payment unlocks once the KYC status becomes complete.
                </AppText>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.kycFormContent}>
                  <AppInput label="Door No." value={kycDetails.doorNo} onChangeText={(value) => updateKycDetail('doorNo', value)} required />
                  <AppInput label="Address" value={kycDetails.address1} onChangeText={(value) => updateKycDetail('address1', value)} required />
                  <AppInput label="Area" value={kycDetails.area} onChangeText={(value) => updateKycDetail('area', value)} />
                  <AppInput label="City" value={kycDetails.city} onChangeText={(value) => updateKycDetail('city', value)} required />
                  <AppInput label="State" value={kycDetails.state} onChangeText={(value) => updateKycDetail('state', value)} required />
                  <AppInput label="Country" value={kycDetails.country} onChangeText={(value) => updateKycDetail('country', value)} />
                  <AppInput label="PIN Code" value={kycDetails.pinCode} onChangeText={(value) => updateKycDetail('pinCode', value)} keyboardType="number-pad" required />
                  <AppInput label="Email" value={kycDetails.email} onChangeText={(value) => updateKycDetail('email', value)} keyboardType="email-address" autoCapitalize="none" required />
                  <AppInput label="Date of Birth (YYYY-MM-DD)" value={kycDetails.dob} onChangeText={(value) => updateKycDetail('dob', value)} />
                  <AppInput label="Marital Status" value={kycDetails.maritalStatus} onChangeText={(value) => updateKycDetail('maritalStatus', value)} />
                  <AppInput label="Anniversary Date (YYYY-MM-DD)" value={kycDetails.anniversaryDate} onChangeText={(value) => updateKycDetail('anniversaryDate', value)} />
                  <AppInput label="ID Proof" value={kycDetails.idProof} onChangeText={(value) => updateKycDetail('idProof', value)} />
                  <AppInput label="ID Proof Number" value={kycDetails.idProofNo} onChangeText={(value) => updateKycDetail('idProofNo', value)} />
                  <AppInput label="Masked Aadhaar" value={kycDetails.aadhaarMasked} onChangeText={(value) => updateKycDetail('aadhaarMasked', value)} />
                  <AppInput label="Nominee Name" value={kycDetails.nomeni} onChangeText={(value) => updateKycDetail('nomeni', value)} />
                  <AppInput label="Nominee Mobile" value={kycDetails.nomineeMobile} onChangeText={(value) => updateKycDetail('nomineeMobile', value)} keyboardType="phone-pad" />
                  <AppInput label="Nominee Relationship" value={kycDetails.nomineeRelationship} onChangeText={(value) => updateKycDetail('nomineeRelationship', value)} />
                </ScrollView>
                <AppButton label="Save KYC Details" size="lg" loading={savingKycDetails} onPress={saveKycDetails} />
                <AppButton label="Back" variant="ghost" size="md" style={styles.kycSecondaryButton} onPress={() => setShowKycForm(false)} />
              </>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.bottomBar}>
        <AppButton
          label={`${formatCurrency(paymentAmount)}  ·  Pay Now`}
          size="lg"
          loading={isLoading}
          disabled={kycCheckState !== 'ready'}
          onPress={handlePayment}
        />
        <AppText variant="caption" align="center" style={styles.payNote}>
          You'll be redirected to Razorpay secure checkout
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surfaceMuted },
  scrollContent: { paddingBottom: 0 },

  badgeRow: {
    flexDirection: 'row',
    gap: SIZES.space.sm,
    marginBottom: SIZES.space.sm,
  },
  card: {
    marginBottom: SIZES.space.md,
  },
  memberName: {
    marginBottom: SIZES.space.xs,
    textTransform: 'uppercase',
  },
  schemeName: {
    marginBottom: SIZES.space.lg,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: SIZES.radius.pill,
    overflow: 'hidden',
    marginBottom: SIZES.space.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.brand,
    borderRadius: SIZES.radius.pill,
  },
  progressText: {
    marginBottom: SIZES.space.sm,
  },
  nextBadge: {
    backgroundColor: COLORS.accentSoft,
    padding: SIZES.space.sm,
    borderRadius: SIZES.radius.sm,
    alignItems: 'center',
    marginBottom: SIZES.space.sm,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.space.sm,
  },
  dueBadge: {
    backgroundColor: COLORS.accentSubtle,
    padding: SIZES.space.sm,
    borderRadius: SIZES.radius.sm,
    alignItems: 'center',
  },

  sectionTitle: {
    marginBottom: SIZES.space.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.space.sm,
  },

  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSunken,
    padding: SIZES.space.lg,
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.space.sm,
  },
  methodIcon: { fontSize: SIZES.icon.lg, marginRight: SIZES.space.sm },
  methodInfo: { flex: 1 },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    padding: SIZES.space.md,
    borderRadius: SIZES.radius.sm,
  },
  secureText: { flex: 1 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SIZES.space.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : SIZES.space.lg,
  },
  payNote: {
    marginTop: SIZES.space.sm,
  },

  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.space.xxxl,
  },
  statusIcon: { fontSize: 64, marginBottom: SIZES.space.lg },
  statusSpacing: { marginBottom: SIZES.space.sm },
  statusDetail: { marginBottom: SIZES.space.xs },
  paymentIdText: { marginBottom: SIZES.space.xxxl },
  actionBtn: { marginBottom: SIZES.space.sm },
  kycStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.space.xxxl,
  },
  kycStateText: {
    marginVertical: SIZES.space.lg,
  },
  kycBackButton: {
    marginTop: SIZES.space.sm,
  },
  kycModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  kycModalCard: {
    maxHeight: '88%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.radius.xl,
    borderTopRightRadius: SIZES.radius.xl,
    padding: SIZES.space.lg,
  },
  kycModalMessage: {
    marginTop: SIZES.space.sm,
    marginBottom: SIZES.space.lg,
    lineHeight: SIZES.text.md * 1.4,
  },
  kycSecondaryButton: {
    marginTop: SIZES.space.sm,
  },
  kycFormContent: {
    paddingBottom: SIZES.space.md,
  },
});

export default PayNow;
