// Src/Screens/MemberCreation/SchemeJoiningForm.tsx
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Modal, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSchemeGroupOptions } from '../../api/hooks/Schemes/useSchemeGroupOptions';
import { useTransactionTypes } from '../../api/hooks/Account/useTransactionTypes';
import { Scheme } from '../../types/Scheme/Scheme';
import { AppText, AppCard, AppBadge, AppInput, AppSectionHeader } from '../../Components/ui/appcomponents';
import theme from '../../Utills/AppTheme';

const { COLORS, SIZES, ELEVATION } = theme;

// NOTE: All payments in this flow are collected online via Razorpay
// (see MemberCreation.tsx's startPayment/schemeCollectInsert payload, which
// always sends modePay: 4 / accCode: "00001" / "Online"). A payment-method
// picker (cash/cheque/NEFT/etc.) was previously built here but would have
// been misleading since selecting anything other than "Online" would not
// have changed how the charge is actually processed. It's been removed in
// favor of the accurate read-only "Online" indicator below. If offline
// payment modes are ever wired up end-to-end, reintroduce a real picker
// backed by useTransactionTypes here.
//
// The scheme-amount selector was previously a native @react-native-picker/
// picker, then briefly an AppChip grid. Now it's a custom dropdown: a
// closed, input-styled field that opens a modal list on tap (like the
// dropdown UX requested), while still avoiding @react-native-picker/picker's
// known Android crash risk under memory pressure / on some OEM ROMs (the
// same class of issue fixed for the Razorpay WebView via onRenderProcessGone).

export interface SchemeJoiningFormData {
  schemeId?: number;
  schemeName?: string;
  selectedScheme: string;
  amount: number | null;
  regNo: number;
  paymentType: string;
  metalType?: string;
  schemeCode?: string;
}

export interface SchemeJoiningFormRef {
  validateAndSubmit: () => boolean;
  getFormData: () => SchemeJoiningFormData;
}

export interface SchemeJoiningUserSummary {
  userName?: string;
  lastName?: string;
  mobileNumber?: string;
  emailAddress?: string;
}

export interface SchemeJoiningFormProps {
  scheme?: Scheme;
  onSubmit?: (data: SchemeJoiningFormData) => void;
  initialData?: { selectedScheme?: string } | null;
  // Registration data collected in Step 1 — shown here so the member can
  // confirm who they're registering/paying for before submitting payment.
  // Previously this screen only showed scheme/payment info with no trace
  // of the just-filled-in registration form.
  userData?: SchemeJoiningUserSummary;
}

const METAL_TYPE_NAMES: Record<string, string> = {
  G: 'Gold',
  S: 'Silver',
  B: 'Bronze',
  C: 'Copper',
};

const SchemeJoiningForm = forwardRef<SchemeJoiningFormRef, SchemeJoiningFormProps>(
  ({ scheme, initialData = null, userData }, ref) => {
    const { schemes, loading: loadingSchemes, error: errorSchemes, getAmount, getRegNo } = useSchemeGroupOptions(
      scheme?.SchemeId
    );
    const { onlinePayMode, transactionTypes } = useTransactionTypes();
    const onlineEntry = transactionTypes.find((t) => t.NAME.trim().toUpperCase() === 'ONLINE');
    const paymentLabel = onlineEntry ? `${onlineEntry.NAME} (${onlineEntry.ACCOUNT})` : (onlinePayMode ? `ONLINE (${onlinePayMode.accCode})` : 'Online');

    const [selectedScheme, setSelectedScheme] = useState('');
    const [selectedPayment] = useState('00001');
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [customAmount, setCustomAmount] = useState('');

    // When installments are not fixed, customers enter their own amount.
    // WeightLedger does not change this rule; FixedIns is the source of truth.
    const isUserAmountScheme = scheme?.FixedIns === 'N' && Number(scheme?.Instalment) > 1;
    const effectiveAmount = isUserAmountScheme ? Number(customAmount) || null : getAmount(selectedScheme);

    useEffect(() => {
      if (initialData) {
        setSelectedScheme(initialData.selectedScheme || '');
      } else if (schemes.length > 0 && !selectedScheme) {
        setSelectedScheme(schemes[0].GROUPCODE);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schemes, initialData]);

    useEffect(() => {
      setCustomAmount('');
    }, [scheme?.SchemeId]);

    const validateForm = (): boolean => {
      if (!selectedScheme) {
        return false;
      }
      if (!selectedPayment) {
        return false;
      }
      if (!effectiveAmount || effectiveAmount <= 0) {
        return false;
      }
      return true;
    };

    const prepareSubmissionData = (): SchemeJoiningFormData => {
      const amount = effectiveAmount;
      const regNo = getRegNo(selectedScheme);
      const paymentType = 'Online';

      return {
        schemeId: scheme?.SchemeId,
        schemeName: scheme?.schemeName,
        selectedScheme,
        amount,
        regNo,
        paymentType,
        metalType: scheme?.MetalType,
        schemeCode: scheme?.SchemeSName,
      };
    };

    useImperativeHandle(ref, () => ({
      validateAndSubmit: () => validateForm(),
      getFormData: () => prepareSubmissionData(),
    }));

    const getMetalTypeName = (metalType?: string) => (metalType ? METAL_TYPE_NAMES[metalType] || metalType : 'N/A');

    if (loadingSchemes) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.contentBrand} />
          <AppText variant="bodySmall" color={COLORS.contentSecondary} style={{ marginTop: SIZES.space.sm }}>
            Loading schemes...
          </AppText>
        </View>
      );
    }

    if (errorSchemes) {
      return (
        <View style={styles.errorContainer}>
          <AppText variant="bodyBold" color={COLORS.danger} align="center">
            Error loading schemes: {errorSchemes}
          </AppText>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

        {/* Member Details (from Step 1 registration) */}
        {userData && (userData.userName || userData.mobileNumber || userData.emailAddress) && (
          <AppCard style={styles.card}>
            <AppSectionHeader title="Member Details" />
            <View style={styles.detailRow}>
              <AppText variant="bodySmall" color={COLORS.contentSecondary}>
                Name
              </AppText>
              <AppText variant="bodyBold">
                {[userData.userName, userData.lastName].filter(Boolean).join(' ') || 'N/A'}
              </AppText>
            </View>
            <View style={styles.detailRow}>
              <AppText variant="bodySmall" color={COLORS.contentSecondary}>
                Mobile
              </AppText>
              <AppText variant="bodyBold">{userData.mobileNumber || 'N/A'}</AppText>
            </View>
            <View style={[styles.detailRow, { marginBottom: 0 }]}>
              <AppText variant="bodySmall" color={COLORS.contentSecondary}>
                Email
              </AppText>
              <AppText variant="bodyBold">{userData.emailAddress || 'N/A'}</AppText>
            </View>
          </AppCard>
        )}

        {/* Scheme Details Card */}
        <AppCard style={styles.card}>
          <AppSectionHeader title="Selected Scheme Details" />
          <View style={styles.detailRow}>
            <AppText variant="bodySmall" color={COLORS.contentSecondary} style={styles.detailLabel}>
              Scheme Name
            </AppText>
            <AppText variant="bodyBold" style={styles.detailValue} numberOfLines={2}>
              {scheme?.schemeName || 'N/A'}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText variant="bodySmall" color={COLORS.contentSecondary}>
              Scheme Code
            </AppText>
            <AppText variant="bodyBold">{scheme?.SchemeSName || 'N/A'}</AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText variant="bodySmall" color={COLORS.contentSecondary}>
              Metal Type
            </AppText>
            <AppBadge label={`${getMetalTypeName(scheme?.MetalType)} (${scheme?.MetalType || 'N/A'})`} variant="gold" />
          </View>
        </AppCard>

        {/* Scheme Amount Selection */}
        <AppCard style={styles.card}>
          <AppSectionHeader title={isUserAmountScheme ? 'Enter Scheme Amount' : 'Select Scheme Amount'} />
          {schemes.length === 0 ? (
            <AppText variant="bodySmall" color={COLORS.contentSecondary}>
              No schemes available
            </AppText>
          ) : isUserAmountScheme ? (
            <>
              <AppInput
                label="Installment Amount"
                required
                value={customAmount}
                onChangeText={(value) => setCustomAmount(value.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="Enter amount"
                leftIcon="cash-outline"
                hint="Enter the amount you would like to pay for each installment."
              />
              <View style={styles.amountContainer}>
                <View>
                  <AppText variant="bodySmall" color={COLORS.successText}>Scheme Group</AppText>
                  <AppText variant="caption" color={COLORS.successText}>Code: {selectedScheme || 'N/A'}</AppText>
                </View>
                <AppText variant="h4" color={COLORS.successText}>
                  {effectiveAmount ? `₹${effectiveAmount}` : 'Enter amount'}
                </AppText>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={styles.dropdownField}
              activeOpacity={0.7}
              onPress={() => setDropdownVisible(true)}
            >
              <AppText variant="body" color={selectedScheme ? COLORS.contentPrimary : COLORS.contentPlaceholder}>
                {selectedScheme
                  ? `${selectedScheme} · ₹${getAmount(selectedScheme)}`
                  : 'Select an amount'}
              </AppText>
              <Icon name="chevron-down" size={20} color={COLORS.contentSecondary} />
            </TouchableOpacity>
          )}

          {!isUserAmountScheme && selectedScheme && (
            <View style={styles.amountContainer}>
              <View>
                <AppText variant="bodySmall" color={COLORS.successText}>
                  Selected Amount
                </AppText>
                <AppText variant="caption" color={COLORS.successText}>
                  Code: {selectedScheme}
                </AppText>
              </View>
              <AppText variant="h4" color={COLORS.successText}>
                ₹{getAmount(selectedScheme)}
              </AppText>
            </View>
          )}
        </AppCard>

        {/* Scheme Amount Dropdown Modal */}
        {!isUserAmountScheme && (
        <Modal visible={dropdownVisible} transparent animationType="fade" onRequestClose={() => setDropdownVisible(false)}>
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.dropdownSheet} onStartShouldSetResponder={() => true}>
              <AppText variant="h5" style={{ marginBottom: SIZES.space.lg }}>
                Select Scheme Amount
              </AppText>
              <FlatList
                data={schemes}
                keyExtractor={(item) => item.GROUPCODE}
                style={styles.dropdownList}
                renderItem={({ item }) => {
                  const isSelected = selectedScheme === item.GROUPCODE;
                  return (
                    <TouchableOpacity
                      style={[styles.dropdownRow, isSelected && styles.dropdownRowSelected]}
                      onPress={() => {
                        setSelectedScheme(item.GROUPCODE);
                        setDropdownVisible(false);
                      }}
                    >
                      <AppText variant={isSelected ? 'bodyBold' : 'body'} color={isSelected ? COLORS.accent : COLORS.contentPrimary}>
                        {item.GROUPCODE} · ₹{item.AMOUNT}
                      </AppText>
                      {isSelected && <Icon name="checkmark-circle" size={20} color={COLORS.contentBrand} />}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>
        )}

        {/* Payment Method (see note above the component: always Online via Razorpay) */}
        <AppCard style={styles.card}>
          <AppSectionHeader title="Payment Method" />
          <View style={styles.paymentDetails}>
            <AppText variant="bodySmall" color={COLORS.contentBrand}>
              Payment Type
            </AppText>
            <AppText variant="h6" color={COLORS.contentBrand}>
              {paymentLabel}
            </AppText>
          </View>
        </AppCard>

        {/* Summary Card */}
        {selectedScheme && selectedPayment && effectiveAmount && (
          <AppCard variant="premium" style={styles.card}>
            <AppText variant="h5" align="center" color={COLORS.contentBrand} style={{ marginBottom: SIZES.space.lg }}>
              Order Summary
            </AppText>

            <View style={styles.summaryRow}>
              <AppText variant="bodySmall" color={COLORS.contentBrand} style={styles.detailLabel}>
                Scheme
              </AppText>
              <AppText variant="bodyBold" color={COLORS.contentBrand} style={styles.detailValue} numberOfLines={2}>
                {scheme?.schemeName}
              </AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText variant="bodySmall" color={COLORS.contentBrand}>
                Scheme Code
              </AppText>
              <AppText variant="bodyBold" color={COLORS.contentBrand}>
                {selectedScheme}
              </AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText variant="bodySmall" color={COLORS.contentBrand}>
                Amount
              </AppText>
              <AppText variant="bodyBold" color={COLORS.contentBrand}>
                ₹{effectiveAmount}
              </AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText variant="bodySmall" color={COLORS.contentBrand}>
                Payment Type
              </AppText>
              <AppText variant="bodyBold" color={COLORS.contentBrand}>
                {paymentLabel}
              </AppText>
            </View>
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <AppText variant="bodySmall" color={COLORS.contentBrand}>
                Metal Type
              </AppText>
              <AppText variant="bodyBold" color={COLORS.contentBrand}>
                {getMetalTypeName(scheme?.MetalType)}
              </AppText>
            </View>
          </AppCard>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  }
);

SchemeJoiningForm.displayName = 'SchemeJoiningForm';
export default SchemeJoiningForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
  },
  contentContainer: {
    padding: SIZES.space.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.space.xl,
    backgroundColor: COLORS.surfaceMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.space.xl,
    backgroundColor: COLORS.surfaceMuted,
  },
  header: {
    marginBottom: SIZES.space.lg,
    paddingBottom: SIZES.space.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  card: {
    marginBottom: SIZES.space.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.space.sm,
  },
  detailLabel: {
    flex: 1,
  },
  detailValue: {
    flex: 2,
    textAlign: 'right',
  },
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.fieldBorder,
    borderRadius: SIZES.radius.field,
    paddingHorizontal: SIZES.space.md,
    paddingVertical: SIZES.space.md,
    backgroundColor: COLORS.fieldBackground,
    marginBottom: SIZES.space.lg,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.space.xl,
  },
  dropdownSheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.xl,
    padding: SIZES.space.lg,
    maxHeight: '70%',
    ...ELEVATION.floating,
  },
  dropdownList: {
    flexGrow: 0,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.space.md,
    paddingHorizontal: SIZES.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  dropdownRowSelected: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: SIZES.radius.sm,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    padding: SIZES.space.md,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.success + '40',
  },
  paymentDetails: {
    backgroundColor: COLORS.accentSoft,
    padding: SIZES.space.md,
    borderRadius: SIZES.radius.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.space.sm,
    paddingBottom: SIZES.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.brandAlpha16,
  },
  bottomSpacing: {
    height: 30,
  },
});
