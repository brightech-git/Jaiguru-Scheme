// Src/Screens/PayNow/PayNow.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTodayRate } from '../../api/hooks/Rates/useTodayRate';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useRazorpayPayment } from '../../api/hooks/Razorpay/useRazorpay';
import { useTransactionTypes } from '../../api/hooks/Account/useTransactionTypes';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../Components/PremiumBackground/PremiumBackground';
import { AppCard, AppText, AppButton, AppBadge, AppDivider, ScreenWrapper } from '../../Components/ui/appcomponents';
import theme from '../../Utills/AppTheme';
import { PAYMENT_CONSTANTS } from '../../constants/paymentConstants';

const { COLORS, SIZES } = theme;

const STATUS = { IDLE: 'idle', SUCCESS: 'success', FAILED: 'failed' } as const;
type Status = (typeof STATUS)[keyof typeof STATUS];

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
  const insets = useSafeAreaInsets();
  const { rates, loading: rateLoading, error: rateError } = useTodayRate();
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
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const { onlinePayMode } = useTransactionTypes();

  const {
    loading: paymentLoading,
    startPayment,
    resetState: resetPayment,
  } = useRazorpayPayment();

  const formatCurrency = useCallback((value: unknown) => {
    const n = parseFloat(String(value)) || 0;
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }, []);

  const formatDate = useCallback((d?: string) => {
    if (!d) return 'N/A';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', {
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
    return Math.min(100, Math.max(0, (paid / total) * 100));
  }, [installmentsPaid, totalInstallments]);
  const goldRate = Number(rates?.GOLDRATE);
  const hasGoldRate = !rateLoading && !rateError && Number.isFinite(goldRate) && goldRate > 0;
  const estimatedWeight = hasGoldRate && paymentAmount > 0 ? paymentAmount / goldRate : null;
  const weightScheme = accountData?.schemeSummary?.weightLedger === 'Y';

  const formatApiDate = (date: Date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d} 00:00:00`;
  };

  const handlePayment = useCallback(async () => {
    if (paymentLoading) return;
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
      setConfirmationPending(result.pending === true);
      setStatus(STATUS.FAILED);
      resetPayment();
    }
  }, [paymentLoading, paymentAmount, memberName, accountData, regNo, groupCode, startPayment, nextInstallment, schemeId, resetPayment]);

  const isLoading = paymentLoading;

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
            {confirmationPending ? 'Payment status' : 'Payment Failed'}
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <AppText variant="labelUppercase" color={COLORS.contentBrand}>YOUR GOLD JOURNEY</AppText>
          <AppText variant="h3">A step closer to something precious</AppText>
          <AppText variant="bodySmall" color={COLORS.contentSecondary}>Review your installment before you pay.</AppText>
        </View>
        {/* <LinearGradient colors={COLORS.gradient.brandDeep as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroHeading}>
            <MaterialCommunityIcons name="gold" size={32} color={COLORS.contentOnBrand} />
            <AppText variant="label" color={COLORS.contentOnBrand}>INSTALLMENT {nextInstallment}</AppText>
          </View>
          <AppText variant="bodySmall" color={COLORS.contentOnBrand}>Amount to pay</AppText>
          <AppText variant="h1" color={COLORS.contentOnBrand} style={styles.heroAmount}>{formatCurrency(paymentAmount)}</AppText>
          <View style={styles.heroFoot}>
            <AppText variant="bodySmall" color={COLORS.contentOnBrand}>{schemeShortName || 'Gold savings scheme'}</AppText>
            <AppText variant="bodySmall" color={COLORS.contentOnBrand}>{nextDueDate ? `Due ${formatDate(nextDueDate)}` : 'Secure online payment'}</AppText>
          </View>
        </LinearGradient> */}
        {/* Scheme Card */}
        <AppCard style={styles.card}>
          <View style={styles.badgeRow}>
            <AppBadge label={schemeShortName || 'SCHEME'} variant="primary" />
            <AppBadge label={`REG: ${regNo ?? '—'}`} variant="neutral" />
          </View>
          <AppText variant="h3" style={styles.memberName}>
            {memberName || accountData?.pName || 'Scheme member'}
          </AppText>
          <AppText variant="body" color={COLORS.contentSecondary} numberOfLines={2} style={styles.schemeName}>
            {schemeName || 'Gold savings scheme'}
          </AppText>

          <AppDivider />

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <AppText variant="bodySmall" color={COLORS.contentSecondary} style={styles.progressText}>
            {installmentsPaid || 0}/{totalInstallments || '—'} Installments Paid
          </AppText>

          <View style={styles.nextBadge}>
            <AppText variant="bodyMedium" color={COLORS.contentBrand}>
              Next Installment: #{nextInstallment}
            </AppText>
          </View>

          {/* <View style={styles.dateRow}>
            <View>
              <AppText variant="caption">Join Date</AppText>
              <AppText variant="bodyBold">{formatDate(joinDate)}</AppText>
            </View>
            <View>
              <AppText variant="caption">Maturity Date</AppText>
              <AppText variant="bodyBold">{formatDate(maturityDate)}</AppText>
            </View>
          </View> */}

          {/* {nextDueDate && (
            <View style={styles.dueBadge}>
              <AppText variant="bodyMedium" color={COLORS.contentBrand}>
                Next Due: {formatDate(nextDueDate)}
              </AppText>
            </View>
          )} */}
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
          <View style={styles.ratePanel}>
            <View style={styles.heroHeading}>
              <MaterialCommunityIcons name="gold" size={22} color={COLORS.contentBrand} />
              <AppText variant="bodyBold">Today's gold · 916</AppText>
            </View>
            {rateLoading ? (
              <View style={styles.heroHeading}>
                <ActivityIndicator size="small" color={COLORS.contentBrand} />
                <AppText variant="bodySmall">Loading today's gold rate...</AppText>
              </View>
            ) : hasGoldRate ? (
              <>
                <View style={styles.row}>
                  <AppText variant="captionBold" color={COLORS.contentSecondary}>Rate per gram</AppText>
                  <AppText variant="bodyBold">{formatCurrency(goldRate)} / g</AppText>
                </View>
                <View style={styles.row}>
                  <AppText variant="captionBold" color={COLORS.contentSecondary}>Estimated gold weight</AppText>
                  <AppText variant="h4" color={COLORS.contentBrand}>{estimatedWeight === null ? '—' : `${estimatedWeight.toFixed(4)} g`}</AppText>
                </View>
                {rates?.GOLDRATEDATE && <AppText variant="caption" color={COLORS.contentSecondary}>Rate date: {formatDate(rates.GOLDRATEDATE)}</AppText>}
                <AppText variant="caption" color={COLORS.contentSecondary} style={styles.estimateNote}>
                  {weightScheme ? 'Estimated from this installment ÷ gold rate. Final credited weight is confirmed in your passbook after payment.' : 'Gold equivalent for reference. This amount-based scheme does not credit this estimated weight.'}
                </AppText>
              </>
            ) : (
              <>
                <AppText variant="bodySmall" color={COLORS.contentSecondary}>{rateError ? 'Unable to load the gold rate.' : 'Gold rate is not available yet.'} Weight estimate is unavailable.</AppText>
                <AppButton label="View gold rates" variant="ghost" size="sm" onPress={() => navigation.navigate('Rates')} />
              </>
            )}
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
        {/* <AppCard style={styles.card}>
          <AppText variant="h5" style={styles.sectionTitle}>
            Payment Method
          </AppText>
          <View style={styles.methodRow}>
            <MaterialCommunityIcons name="shield-lock-outline" size={28} color={COLORS.contentBrand} style={styles.methodIcon} />
            <View style={styles.methodInfo}>
              <AppText variant="h6">Razorpay</AppText>
              <AppText variant="bodySmall" color={COLORS.contentSecondary}>
                Available payment options appear at checkout
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
        </AppCard> */}

      </ScrollView>
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, SIZES.space.md) }]}>
        <AppButton
          label={ `${formatCurrency(paymentAmount)}  ·  Pay Now`}
          size="lg"
          loading={isLoading}
          disabled={paymentAmount <= 0 || !Number.isFinite(paymentAmount)}
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
  scroll: { flex: 1 },
  scrollContent: { padding: SIZES.space.lg, paddingBottom: SIZES.space.xl, width: '100%', maxWidth: 640, alignSelf: 'center' },
  intro: { gap: SIZES.space.sm, marginBottom: SIZES.space.xl },
  hero: { borderRadius: SIZES.radius.xl, padding: SIZES.space.xl, marginBottom: SIZES.space.lg, gap: SIZES.space.sm },
  heroHeading: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.sm, flexWrap: 'wrap' },
  heroAmount: { fontVariant: ['tabular-nums'], marginBottom: SIZES.space.sm },
  heroFoot: { borderTopWidth: 1, borderTopColor: COLORS.brand, paddingTop: SIZES.space.md, gap: SIZES.space.xs },
  ratePanel: { backgroundColor: COLORS.accentSoft, borderRadius: SIZES.radius.md, padding: SIZES.space.md, marginVertical: SIZES.space.md, gap: SIZES.space.sm },
  estimateNote: { lineHeight: 18, textTransform: 'none' },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.space.sm,
    marginBottom: SIZES.space.sm,
  },
  card: {
    marginBottom: SIZES.space.md,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
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
    flexWrap: 'wrap',
    gap: SIZES.space.md,
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
    flexWrap: 'wrap',
    gap: SIZES.space.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.space.sm,
  },

  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.space.sm,
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
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SIZES.space.lg,
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

});

export default PayNow;
