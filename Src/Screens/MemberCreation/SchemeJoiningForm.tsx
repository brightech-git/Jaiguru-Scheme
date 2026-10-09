import { TextInput } from '../../Components/Typography/FontText';
// Src/Screens/MemberCreation/SchemeJoiningForm.tsx
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Modal, TouchableOpacity, FlatList, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSchemeGroupOptions } from '../../api/hooks/Schemes/useSchemeGroupOptions';
import { useTransactionTypes } from '../../api/hooks/Account/useTransactionTypes';
import { Scheme } from '../../types/Scheme/Scheme';
import { AppText, AppCard } from '../../Components/ui/appcomponents';
import theme from '../../Utills/AppTheme';
import EmployeePickerModal, { DEFAULT_EMPLOYEE_ID, SelectedEmployee } from './EmployeePickerModal';

import InstallmentAmountInput, { isValidInstallmentAmount } from './installment-amount-input';

const { COLORS, SIZES, ELEVATION, moderateScale } = theme;

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
// The scheme-amount selector avoids @react-native-picker/picker because of
// its known Android crash risk under memory pressure / on some OEM ROMs (the
// same class of issue fixed for the Razorpay WebView via onRenderProcessGone).
// Short option lists render as tappable amount tiles; longer ones fall back
// to a field that opens a bottom-sheet list.
const MAX_INLINE_AMOUNT_TILES = 8;

export interface SchemeJoiningFormData {
  schemeId?: number;
  schemeName?: string;
  selectedScheme: string;
  amount: number | null;
  regNo: number;
  paymentType: string;
  metalType?: string;
  schemeCode?: string;
  /** Referring employee, sent as iEmp. DEFAULT_EMPLOYEE_ID when none was picked. */
  employeeId: string;
  nickname?: string;
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
  userData?: SchemeJoiningUserSummary;
  // Lets the parent show the payable amount next to the pay button.
  onAmountChange?: (amount: number | null) => void;
}

const METAL_TYPE_NAMES: Record<string, string> = {
  G: 'Gold',
  S: 'Silver',
  B: 'Bronze',
  C: 'Copper',
};

const formatINR = (value?: number | null): string => {
  const n = Number(value);
  if (!value || isNaN(n)) return '0';
  try {
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  } catch {
    return String(n);
  }
};

const getInitials = (name?: string): string => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

const SectionTitle = ({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) => (
  <View style={styles.sectionTitle}>
    <View style={styles.sectionIcon}>
      <Icon name={icon} size={SIZES.icon.sm} color={COLORS.contentBrand} />
    </View>
    <View style={styles.flex1}>
      <AppText variant="h6">{title}</AppText>
      {subtitle ? (
        <AppText variant="caption" color={COLORS.contentMuted}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  </View>
);

const SummaryRow = ({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) => (
  <View style={[styles.summaryRow, highlight && styles.summaryRowHighlight]}>
    <AppText variant={highlight ? 'bodyMedium' : 'bodySmall'} color={highlight ? COLORS.contentBrand : COLORS.contentMuted}>
      {label}
    </AppText>
    <AppText variant={highlight ? 'h6' : 'bodyMedium'} color={highlight ? COLORS.contentBrand : undefined} style={styles.summaryValue} numberOfLines={2}>
      {value || 'N/A'}
    </AppText>
  </View>
);

const SchemeJoiningForm = forwardRef<SchemeJoiningFormRef, SchemeJoiningFormProps>(
  ({ scheme, initialData = null, userData, onAmountChange }, ref) => {
    const insets = useSafeAreaInsets();
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
    const [estimatedWeight, setEstimatedWeight] = useState<number | null>(null);
    const [employee, setEmployee] = useState<SelectedEmployee>({ id: DEFAULT_EMPLOYEE_ID });
    const [employeePickerVisible, setEmployeePickerVisible] = useState(false);
    const [employeeFieldVisible, setEmployeeFieldVisible] = useState(false);
    const [nickname, setNickname] = useState('');
    const nameTapCount = useRef(0);

    const handleNamePress = () => {
      nameTapCount.current += 1;
      if (nameTapCount.current === 3) {
        setEmployeeFieldVisible((visible) => !visible);
        setEmployeePickerVisible(false);
        nameTapCount.current = 0;
      }
    };

    // When installments are not fixed, customers enter their own amount.
    // WeightLedger does not change this rule; FixedIns is the source of truth.
    const isUserAmountScheme = scheme?.FixedIns === 'N' && Number(scheme?.Instalment) > 1;
    const effectiveAmount = isUserAmountScheme ? (isValidInstallmentAmount(customAmount) ? Number(customAmount) : null) : getAmount(selectedScheme);
    const showInlineTiles = schemes.length <= MAX_INLINE_AMOUNT_TILES;

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

    useEffect(() => {
      onAmountChange?.(effectiveAmount || null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveAmount]);

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
        employeeId: employee.id || DEFAULT_EMPLOYEE_ID,
        nickname: nickname.trim() || undefined,
      };
    };

    useImperativeHandle(ref, () => ({
      validateAndSubmit: () => validateForm(),
      getFormData: () => prepareSubmissionData(),
    }));

    const getMetalTypeName = (metalType?: string) => (metalType ? METAL_TYPE_NAMES[metalType] || metalType : 'N/A');
    const metalColor = scheme?.MetalType === 'G' ? COLORS.accentDeep : COLORS.borderStrong;

    if (loadingSchemes) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={COLORS.contentBrand} />
          <AppText variant="bodySmall" color={COLORS.contentSecondary} style={{ marginTop: SIZES.space.sm }}>
            Loading scheme options...
          </AppText>
        </View>
      );
    }

    if (errorSchemes) {
      return (
        <View style={styles.stateContainer}>
          <View style={styles.errorIcon}>
            <Icon name="alert-circle-outline" size={SIZES.icon.xl} color={COLORS.danger} />
          </View>
          <AppText variant="bodyMedium" color={COLORS.dangerText} align="center">
            Couldn't load scheme options
          </AppText>
          <AppText variant="caption" align="center" style={{ marginTop: SIZES.space.xs }}>
            {errorSchemes}
          </AppText>
        </View>
      );
    }

    const fullName = [userData?.userName, userData?.lastName].filter(Boolean).join(' ');
    const hasUserData = !!(userData && (userData.userName || userData.mobileNumber || userData.emailAddress));

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Scheme hero */}
        <LinearGradient
          colors={COLORS.gradient.brandDeep as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroGlow} />
          <AppText variant="labelUppercase" color={COLORS.whiteAlpha80}>
            You're joining Jaiguru
          </AppText>
          <AppText variant="h4" color={COLORS.contentOnBrand} numberOfLines={2} style={styles.heroTitle}>
            {scheme?.schemeName || 'Scheme'}
          </AppText>
          <View style={styles.heroPills}>
            {scheme?.SchemeSName ? (
              <View style={styles.heroPill}>
                <Icon name="pricetag-outline" size={SIZES.icon.xs} color={COLORS.contentOnBrand} />
                <AppText variant="captionBold" color={COLORS.contentOnBrand}>
                  {scheme.SchemeSName}
                </AppText>
              </View>
            ) : null}
            <View style={styles.heroPill}>
              <View style={[styles.metalDot, { backgroundColor: metalColor }]} />
              <AppText variant="captionBold" color={COLORS.contentOnBrand}>
                {getMetalTypeName(scheme?.MetalType)}
              </AppText>
            </View>
            {Number(scheme?.Instalment) > 0 ? (
              <View style={styles.heroPill}>
                <Icon name="calendar-outline" size={SIZES.icon.xs} color={COLORS.contentOnBrand} />
                <AppText variant="captionBold" color={COLORS.contentOnBrand}>
                  {scheme?.Instalment} installments
                </AppText>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        {/* Member details (from Step 1 registration or the signed-in user) */}
        {hasUserData && (
          <AppCard style={styles.card}>
            <View style={styles.memberHeader}>
              <View style={styles.avatar}>
                <AppText variant="h6" color={COLORS.contentBrand}>
                  {getInitials(fullName)}
                </AppText>
              </View>
              <Pressable style={styles.flex1} onPress={handleNamePress} accessibilityRole="button" accessibilityLabel={fullName || 'Member name'}>
                {/* <AppText variant="caption" color={COLORS.contentMuted}>
                  Member
                </AppText> */}
                <AppText variant="h6" numberOfLines={1}>
                  {fullName || 'N/A'}
                </AppText>
              </Pressable>
              <Icon name="checkmark-circle" size={SIZES.icon.md} color={COLORS.success} />
            </View>
            <View style={styles.memberDivider} />
            <View style={styles.memberInfoRow}>
              <Icon name="call-outline" size={SIZES.icon.sm} color={COLORS.contentMuted} />
              <AppText variant="button" style={styles.flex1} numberOfLines={1}>
                {userData?.mobileNumber || 'N/A'}
              </AppText>
            </View>
            {userData?.emailAddress && (
            <View style={[styles.memberInfoRow, { marginBottom: 0 }]}>
              <Icon name="mail-outline" size={SIZES.icon.sm} color={COLORS.contentMuted} />
              <AppText variant="button" style={styles.flex1} numberOfLines={1}>
                {userData?.emailAddress || 'N/A'}
              </AppText>
            </View>
            )}
          </AppCard>
        )}

        {/* Installment amount */}
        <AppCard style={styles.card}>
          <SectionTitle
            icon="wallet-outline"
            title={isUserAmountScheme ? 'Enter Installment Amount' : 'Choose Installment Amount'}
            subtitle={isUserAmountScheme ? 'You pay this amount every installment' : 'Pick the plan that suits you'}
          />

          {schemes.length === 0 ? (
            <View style={styles.emptyAmount}>
              <Icon name="information-circle-outline" size={SIZES.icon.md} color={COLORS.contentMuted} />
              <AppText variant="bodySmall" color={COLORS.contentSecondary}>
                No amount options are available for this scheme.
              </AppText>
            </View>
          ) : isUserAmountScheme ? (
            <InstallmentAmountInput
              value={customAmount}
              onChange={setCustomAmount}
              metalType={scheme?.MetalType}
              onWeightChange={setEstimatedWeight}
            />
          ) : showInlineTiles ? (
            <View style={styles.tileGrid}>
              {schemes.map((item) => {
                const isSelected = selectedScheme === item.GROUPCODE;
                return (
                  <TouchableOpacity
                    key={item.GROUPCODE}
                    activeOpacity={0.8}
                    onPress={() => setSelectedScheme(item.GROUPCODE)}
                    style={[styles.tile, isSelected && styles.tileSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    {isSelected && (
                      <View style={styles.tileCheck}>
                        <Icon name="checkmark" size={SIZES.icon.xs} color={COLORS.contentOnBrand} />
                      </View>
                    )}
                    <AppText variant="h6" color={isSelected ? COLORS.contentBrand : COLORS.contentPrimary}>
                      ₹{formatINR(item.AMOUNT)}
                    </AppText>
                    <AppText variant="caption" color={isSelected ? COLORS.contentBrand : COLORS.contentMuted}>
                      Group {item.GROUPCODE}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.amountField, styles.amountPicker, !!selectedScheme && styles.amountFieldFilled]}
              activeOpacity={0.8}
              onPress={() => setDropdownVisible(true)}
            >
              <View style={styles.flex1}>
                {selectedScheme ? (
                  <>
                    <AppText variant="h3" color={COLORS.contentBrand}>
                      ₹{formatINR(getAmount(selectedScheme))}
                    </AppText>
                    <AppText variant="caption">Group {selectedScheme}</AppText>
                  </>
                ) : (
                  <AppText variant="body" color={COLORS.contentPlaceholder}>
                    Select an amount
                  </AppText>
                )}
              </View>
              <View style={styles.changePill}>
                <AppText variant="captionBold" color={COLORS.contentBrand}>
                  {selectedScheme ? 'Change' : 'Select'}
                </AppText>
                <Icon name="chevron-down" size={SIZES.icon.xs} color={COLORS.contentBrand} />
              </View>
            </TouchableOpacity>
          )}
        </AppCard>

        {/* Scheme amount bottom sheet (long option lists only) */}
        {!isUserAmountScheme && !showInlineTiles && (
          <Modal visible={dropdownVisible} transparent animationType="slide" onRequestClose={() => setDropdownVisible(false)}>
            <Pressable style={styles.sheetOverlay} onPress={() => setDropdownVisible(false)}>
              <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, SIZES.space.lg) }]}>
                <View style={styles.sheetHandle} />
                <AppText variant="h5">Select Installment Amount</AppText>
                <AppText variant="caption" style={{ marginBottom: SIZES.space.md }}>
                  {schemes.length} options available
                </AppText>
                <FlatList
                  data={schemes}
                  keyExtractor={(item) => item.GROUPCODE}
                  style={styles.sheetList}
                  ItemSeparatorComponent={() => <View style={{ height: SIZES.space.sm }} />}
                  renderItem={({ item }) => {
                    const isSelected = selectedScheme === item.GROUPCODE;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.sheetRow, isSelected && styles.sheetRowSelected]}
                        onPress={() => {
                          setSelectedScheme(item.GROUPCODE);
                          setDropdownVisible(false);
                        }}
                      >
                        <View style={styles.flex1}>
                          <AppText variant="h6" color={isSelected ? COLORS.contentBrand : COLORS.contentPrimary}>
                            ₹{formatINR(item.AMOUNT)}
                          </AppText>
                          <AppText variant="caption">Group {item.GROUPCODE}</AppText>
                        </View>
                        <Icon
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={SIZES.icon.md}
                          color={isSelected ? COLORS.contentBrand : COLORS.borderStrong}
                        />
                      </TouchableOpacity>
                    );
                  }}
                />
              </Pressable>
            </Pressable>
          </Modal>
        )}

        <AppCard style={styles.card}>
          <AppText variant="label" style={styles.fieldLabel}>SchemeName (Family Members)</AppText>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            placeholder="Enter Scheme Nominee Name"
            placeholderTextColor={COLORS.contentPlaceholder}
            selectionColor={COLORS.brand}
            autoCapitalize="words"
            accessibilityLabel="Scheme Name, optional"
            style={[styles.inputBox, { color: COLORS.contentPrimary }]}
          />
        </AppCard>

        {/* Employee selector is revealed by three taps on the member name. */}
        {employeeFieldVisible && (
        <AppCard style={styles.card}>
          <AppText variant="label" style={styles.fieldLabel}>
            Employee
          </AppText>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setEmployeePickerVisible(true)}
            style={styles.inputBox}
            accessibilityRole="button"
            accessibilityLabel="Select employee"
          >
            <AppText variant="body" style={styles.flex1} numberOfLines={1}>
              {employee.name ? `${employee.name} (${employee.id})` : employee.id}
            </AppText>
            <Icon name="chevron-down" size={SIZES.icon.sm} color={COLORS.contentMuted} />
          </TouchableOpacity>

         
        </AppCard>
        )}

        <EmployeePickerModal
          visible={employeePickerVisible}
          selectedId={employee.id}
          onSelect={setEmployee}
          onClose={() => setEmployeePickerVisible(false)}
        />

        {/* Order summary */}
        {selectedScheme && selectedPayment && effectiveAmount ? (
          <AppCard style={[styles.card, styles.summaryCard]}>
            <SectionTitle icon="receipt-outline" title="Summary" />
            <SummaryRow label="Scheme" value={scheme?.schemeName} />
            <SummaryRow label="Group Code" value={selectedScheme} />
            <SummaryRow label="Metal" value={getMetalTypeName(scheme?.MetalType)} />
            {estimatedWeight !== null && (
              <SummaryRow label="Accumulated Weight" value={`${estimatedWeight.toFixed(3)} g`} highlight />
            )}
            <View style={styles.dashedDivider} />
            <View style={styles.totalRow}> 
              <View>
                <AppText variant="bodyMedium">Total Payable</AppText>
                <AppText variant="caption">First installment</AppText>
              </View>
              <AppText variant="h3" color={COLORS.contentBrand}>
                ₹{formatINR(effectiveAmount)}
              </AppText>
            </View>
          </AppCard>
        ) : null}

        <View style={styles.trustRow}>
          <Icon name="lock-closed" size={SIZES.icon.xs} color={COLORS.contentMuted} />
          <AppText variant="captionBold">Payments are encrypted and processed securely by Razorpay</AppText>
        </View>
      </ScrollView>
    );
  }
);

SchemeJoiningForm.displayName = 'SchemeJoiningForm';
export default SchemeJoiningForm;

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.space.lg,
    paddingBottom: SIZES.space.huge,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.space.xl,
  },
  errorIcon: {
    width: SIZES.icon.avatarLg,
    height: SIZES.icon.avatarLg,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.dangerSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.space.md,
  },
  card: {
    marginBottom: SIZES.space.lg,
    borderRadius: SIZES.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },

  // Hero
  hero: {
    borderRadius: SIZES.radius.xl,
    padding: SIZES.space.xl,
    marginBottom: SIZES.space.lg,
    overflow: 'hidden',
    ...ELEVATION.brandGlow,
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -60,
    top: -70,
    backgroundColor: COLORS.whiteAlpha10,
  },
  heroTitle: {
    marginTop: SIZES.space.xs,
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.space.sm,
    marginTop: SIZES.space.md,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.space.xs,
    paddingHorizontal: SIZES.space.md,
    paddingVertical: SIZES.space.xs,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.whiteAlpha20,
  },
  metalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Section titles
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.space.md,
    marginBottom: SIZES.space.lg,
  },
  sectionIcon: {
    width: SIZES.control.heightSm,
    height: SIZES.control.heightSm,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Member
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.space.md,
  },
  avatar: {
    width: SIZES.icon.avatar,
    height: SIZES.icon.avatar,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.brandSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SIZES.space.md,
  },
  memberInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.space.sm,
    marginBottom: SIZES.space.sm,
  },

  // Amount
  emptyAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.space.sm,
    padding: SIZES.space.md,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.surfaceMuted,
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.space.sm,
    paddingHorizontal: SIZES.space.lg,
    minHeight: moderateScale(72),
    borderRadius: SIZES.radius.lg,
    borderWidth: 1.5,
    borderColor: COLORS.fieldBorder,
    backgroundColor: COLORS.fieldBackground,
  },
  amountFieldFilled: {
    backgroundColor: COLORS.brandTint,
    borderColor: COLORS.brandAlpha32,
  },
  amountPicker: {
    paddingVertical: SIZES.space.md,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.space.xs,
    paddingHorizontal: SIZES.space.md,
    paddingVertical: SIZES.space.xs,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.brandAlpha32,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: SIZES.space.md,
  },
  tile: {
    width: '48%',
    paddingVertical: SIZES.space.md,
    paddingHorizontal: SIZES.space.md,
    borderRadius: SIZES.radius.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tileSelected: {
    borderColor: COLORS.borderBrand,
    backgroundColor: COLORS.brandTint,
  },
  tileCheck: {
    position: 'absolute',
    top: SIZES.space.sm,
    right: SIZES.space.sm,
    width: SIZES.icon.md,
    height: SIZES.icon.md,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: COLORS.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.radius.xxl,
    borderTopRightRadius: SIZES.radius.xxl,
    paddingHorizontal: SIZES.space.lg,
    paddingTop: SIZES.space.md,
    maxHeight: '75%',
    ...ELEVATION.overlay,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderStrong,
    marginBottom: SIZES.space.lg,
  },
  sheetList: {
    flexGrow: 0,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.space.md,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetRowSelected: {
    borderColor: COLORS.borderBrand,
    backgroundColor: COLORS.brandTint,
  },

  // Employee / payment inputs
  fieldLabel: {
    marginBottom: SIZES.space.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.space.sm,
    height: SIZES.field.height,
    paddingHorizontal: SIZES.space.md,
    borderRadius: SIZES.radius.field,
    borderWidth: 1,
    borderColor: COLORS.fieldBorder,
    backgroundColor: COLORS.fieldBackground,
  },
  inputBoxReadOnly: {
    backgroundColor: COLORS.surfaceSunken,
  },

  // Summary
  summaryCard: {
    borderColor: COLORS.accentSubtle,
    backgroundColor: COLORS.accentTint,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SIZES.space.lg,
    marginBottom: SIZES.space.sm,
  },
  summaryRowHighlight: {
    backgroundColor: COLORS.brandTint,
    borderRadius: SIZES.radius.sm,
    paddingHorizontal: SIZES.space.sm,
    paddingVertical: SIZES.space.xs,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderLeftColor: COLORS.brand,
    borderRightColor: COLORS.brand,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
  },
  // Android only draws dashes on a full border, so this is a 1px-tall box.
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderRadius: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.accentDeep,
    marginVertical: SIZES.space.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.space.xs,
    marginTop: SIZES.space.xs,
  },
});
