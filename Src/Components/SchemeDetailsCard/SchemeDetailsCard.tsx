import { Text } from '../Typography/FontText';
// Src/Components/SchemeDetailsCard/SchemeDetailsCard.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Dimensions } from 'react-native';
import { useMySchemes } from '../../api/hooks/Account/useMySchemes';
import { getUserId } from '../../Utills/AsynchStorageHelper';
import { userService, UserKycDetails } from '../../api/services/userService';
import { redemptionService } from '../../api/services/redemptionService';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Account } from '../../types/Account/Account';
import { COLORS, SIZES, FONTS, ELEVATION } from '../../Utills/AppTheme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_SPACING = SIZES.space.lg;

function hasReachedMaturity(maturityDate?: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/.exec(maturityDate || '');
  if (!match || maturityDate?.startsWith('1900-01-01')) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const maturity = new Date(year, month - 1, day);
  if (maturity.getFullYear() !== year || maturity.getMonth() !== month - 1 || maturity.getDate() !== day) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return maturity.getTime() <= today.getTime();
}

// Compare calendar months, including the year, without shifting date-only
// backend values through UTC conversion. No previous payment allows payment.
function isPaidThisMonth(lastPaidDate?: string): boolean {
  if (!lastPaidDate) return false;
  const match = /^(\d{4})-(\d{2})-/.exec(lastPaidDate);
  if (!match) return false;
  const today = new Date();
  return Number(match[1]) === today.getFullYear() && Number(match[2]) === today.getMonth() + 1;
}

function getNextDueDate(account: Account): string | undefined {
  if (account.nextDueDate?.trim()) return account.nextDueDate;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(account.lastPaidDate || '');
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined;
  date.setDate(date.getDate() + 30);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function CompletedIndicator({ redeemed = false }: { redeemed?: boolean }) {
  const opacity = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  useFocusEffect(useCallback(() => {
    opacity.value = reducedMotion ? 1 : withRepeat(withSequence(
      withTiming(0.4, { duration: 900 }),
      withTiming(1, { duration: 900 }),
    ), -1);
    return () => { cancelAnimation(opacity); opacity.value = 1; };
  }, [opacity, reducedMotion]));
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.completedBadge, redeemed && styles.redeemedBadge, animatedStyle]}>
    <Text style={[styles.completedBadgeText, redeemed && styles.redeemedText]}>{redeemed ? '✓ Redeemed' : '✓ Completed'}</Text>
  </Animated.View>;
}

function OverdueIndicator() {
  const opacity = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  useFocusEffect(useCallback(() => {
    opacity.value = reducedMotion ? 1 : withRepeat(withSequence(
      withTiming(0.35, { duration: 700 }),
      withTiming(1, { duration: 700 }),
    ), -1);
    return () => { cancelAnimation(opacity); opacity.value = 1; };
  }, [opacity, reducedMotion]));
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dueBadge, animatedStyle]}>
    <Text style={styles.dueBadgeText}>Overdue</Text>
  </Animated.View>;
}

export type SchemeDetailsCardFilter = 'all' | 'active' | 'due' | 'completed';

export interface SchemeDetailsCardProps {
  layout?: 'horizontal' | 'vertical';
  filter?: SchemeDetailsCardFilter;
}

export default function SchemeDetailsCard({ layout = 'horizontal', filter = 'all' }: SchemeDetailsCardProps) {
  const { accounts, loading, error, refetch } = useMySchemes();
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const [userKyc, setUserKyc] = useState<UserKycDetails | null>(null);
  const [redemptionStatus, setRedemptionStatus] = useState<Record<string, 'redeemed' | 'available' | 'error'>>({});
  const [redemptionRefresh, setRedemptionRefresh] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setRedemptionStatus({});
    void Promise.allSettled(accounts.map(async account => {
      const key = `${account.groupCode}-${account.regNo}`;
      let status: 'redeemed' | 'available' | 'error';
      try {
        const estimates = await redemptionService.getEstimates({ groupCode: account.groupCode, regNo: account.regNo });
        if (!Array.isArray(estimates)) throw new Error('Invalid estimate response');
        status = estimates.some(item => item.GROUPCODE === account.groupCode && Number(item.RegNo) === Number(account.regNo) && Number.isInteger(Number(item.SlipNo)) && Number(item.SlipNo) > 0) ? 'redeemed' : 'available';
      } catch {
        status = 'error';
      }
      if (active) setRedemptionStatus(previous => ({ ...previous, [key]: status }));
    }));
    return () => { active = false; };
  }, [accounts, redemptionRefresh]));

  useFocusEffect(useCallback(() => {
    let active = true;
    setUserKyc(null);
    const loadKyc = async () => {
      try {
        const userId = await getUserId();
        if (!userId) return;
        const details = await userService.getDetails(userId);
        if (active) setUserKyc(details);
      } catch {
        // Unknown verification status must not be treated as completed.
        if (active) setUserKyc(null);
      }
    };
    void loadKyc();
    return () => { active = false; };
  }, []));

  // Same status derivation used per-card below, applied at the list level
  // so the "all / active / due / completed" filter actually narrows results.
  const filteredAccounts = useMemo(() => {
    if (!accounts) return accounts;

    return accounts.filter((account) => {
      const redemption = redemptionStatus[`${account.groupCode}-${account.regNo}`];
      if (!redemption || redemption === 'redeemed') return false;
      if (filter === 'all') return true;
      const balance = account.schemeSummary?.schemaSummaryTransBalance;
      const insPaid = parseInt(balance?.insPaid || '0', 10);
      const instalment = parseInt(account.schemeSummary?.instalment || '0', 10);
      const isFullyPaid = instalment > 0 && insPaid >= instalment;
      const nextDueDate = getNextDueDate(account);
      const isPaymentDue = !isFullyPaid && nextDueDate && new Date(nextDueDate.split('T')[0].split(' ')[0] + 'T00:00:00') <= new Date();

      if (filter === 'completed') return isFullyPaid;
      if (filter === 'due') return isPaymentDue;
      if (filter === 'active') return !isFullyPaid && !isPaymentDue;
      return true;
    });
  }, [accounts, filter, redemptionStatus]);

  useFocusEffect(
    useCallback(() => {
      refetch?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetch])
  );

  // Memoized values - must be called unconditionally
  const accountCount = useMemo(() => accounts.filter(account => {
    const status = redemptionStatus[`${account.groupCode}-${account.regNo}`];
    return !!status && status !== 'redeemed';
  }).length, [accounts, redemptionStatus]);

  // Memoize list props unconditionally
  const listProps = useMemo(() => {
    if (layout === 'vertical') {
      return {
        numColumns: 1,
        horizontal: false,
        contentContainerStyle: styles.listContainerVertical,
        showsVerticalScrollIndicator: true,
        showsHorizontalScrollIndicator: false,
        keyExtractor: (item: Account, index: number) => `${item.regNo}-${item.groupCode}-${index}`,
      };
    } else {
      return {
        numColumns: undefined,
        horizontal: true,
        contentContainerStyle: styles.listContainer,
        showsHorizontalScrollIndicator: false,
        showsVerticalScrollIndicator: false,
        snapToInterval: CARD_WIDTH + CARD_SPACING,
        decelerationRate: 'fast' as const,
        snapToAlignment: 'center' as const,
        keyExtractor: (item: Account) => `${item.regNo}-${item.groupCode}-${item.schemeSummary?.schemeId || '0'}`,
      };
    }
  }, [layout]);

  // Handlers
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch?.();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleViewAll = useCallback(() => {
    navigation.navigate('AllSchemes');
  }, [navigation]);

  const handleViewDetails = useCallback(
    (account: Account) => {
      // Navigate to SchemeDetails page with the account data
      navigation.navigate('SchemePassbook', {
        schemeData: account,
        schemeNames: (accounts || []).map(item => item.schemeSummary?.schemeName || '').filter(Boolean),
        fromScreen: 'SchemeDetailsCard',
      });
    },
    [navigation, accounts]
  );

  const handlePayNow = useCallback(
    (account: Account) => {
      // Navigate to PayNow page with all account details
      const paid = Number(account.schemeSummary?.schemaSummaryTransBalance?.insPaid || 0);
      const total = Number(account.schemeSummary?.instalment || 0);
      if (isPaidThisMonth(account.lastPaidDate) || (total > 0 && paid >= total)) return;
      navigation.navigate('Paynow', {
        accountData: account,
        fromScreen: 'SchemeDetailsCard',
        // Pass all relevant details explicitly for easy access
        regNo: account.regNo,
        groupCode: account.groupCode,
        memberName: account.pName,
        schemeName: account.schemeSummary?.schemeName,
        schemeShortName: account.schemeSummary?.schemeSName,
        schemeId: account.schemeSummary?.schemeId,
        totalAmount: account.totalAmount || 0,
        amount: account.amount || 0,
        nextDueDate: getNextDueDate(account),
        installmentsPaid: account.schemeSummary?.schemaSummaryTransBalance?.insPaid || '0',
        totalInstallments: account.schemeSummary?.instalment || '0',
        joinDate: account.joinDate,
        maturityDate: account.maturityDate,
        bonusAmount: (account as any).bonusAmount || 0,
      });
    },
    [navigation]
  );

const formatDate = useCallback((dateString?: string) => {
  if (!dateString) return '-';

  const date = dateString.split('T')[0].split(' ')[0];
  const [year, month, day] = date.split('-');

  return `${day}-${month}-${year}`;
}, []);

  // Render individual account card
  const renderAccountCard = useCallback(
    ({ item: account }: { item: Account }) => {
      const { regNo, groupCode, pName, joinDate, maturityDate, amount, schemeSummary, lastPaidDate } = account;
      const nextDueDate = getNextDueDate(account);

      const balance = schemeSummary?.schemaSummaryTransBalance;
      // const nextPaymentDate = nextDueDate ? formatDate(nextDueDate) : 'N/A';
      const insPaid = parseInt(balance?.insPaid || '0', 10);
      const instalment = parseInt(schemeSummary?.instalment || '0', 10);
      const amtRecd = parseFloat(balance?.amtrecd || '0');
      const totalWeight = parseFloat(schemeSummary?.totalWeight || '0');
      const schemeName = schemeSummary?.schemeName || 'N/A';
      const schemeSName = schemeSummary?.schemeSName || 'N/A';
      const schemeAmt = parseFloat(String(amount)) || 0;
      const progress = instalment > 0 ? insPaid / instalment : 0;
      const isFullyPaid = instalment > 0 && insPaid >= instalment;
      const isPaymentDue = !isFullyPaid && nextDueDate && new Date(nextDueDate.split('T')[0].split(' ')[0] + 'T00:00:00') <= new Date();
      const paidThisMonth = isPaidThisMonth(lastPaidDate);
      const redemption = redemptionStatus[`${groupCode}-${regNo}`];
      const isRedeemed = isFullyPaid && redemption === 'redeemed';
      const isMatured = hasReachedMaturity(maturityDate);

      return (
        <View style={[styles.cardWrapper, layout === 'vertical' && styles.cardWrapperVertical]}>
          <View style={[styles.card, layout === 'vertical' && styles.cardVertical]}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.regBadge}>
                  <Text style={styles.regBadgeText}>
                    {groupCode}-{regNo}
                  </Text>
                </View>
                <View style={styles.schemeBadge}>
                  <Text style={styles.schemeBadgeText}>{schemeSName}</Text>
                </View>
              </View>
              {isFullyPaid ? <CompletedIndicator redeemed={isRedeemed} /> : isPaymentDue && <OverdueIndicator />}
            </View>

            <View style={styles.divider} />

            {/* Body */}
            <View style={styles.cardContent}>
              {/* Name + Scheme */}
              <View style={styles.nameSection}>
                <Text style={styles.nameText}>{pName}</Text>
                <Text style={styles.schemeText}>
                  {`${schemeName}${account.personalInfo?.nomeni?.trim() ? ` - ${account.personalInfo.nomeni.trim()}` : ''}`}
                </Text>
                
              </View>

              {/* 3 stat boxes */}
              <View style={styles.amountSection}>
                <View style={[styles.amountCard, styles.amtCard]}>
                  <Text style={styles.amountLabel}>Monthly Amt</Text>
                  <Text style={styles.amountValue}>₹{schemeAmt.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.amountCard}>
                  <Text style={styles.amountLabel}>Paid Amount</Text>
                  <Text style={styles.amountValue}>₹{amtRecd.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.amountCard}>
                  <Text style={styles.amountLabel}>Gold Weight</Text>
                  <Text style={styles.amountValue}>{totalWeight.toFixed(3)}g</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Installments</Text>
                  <Text style={styles.progressCount}>
                    {insPaid} / {instalment}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
                </View>
              </View>

              {/* Dates */}
              <View style={styles.dateSection}>
                <View style={styles.dateCard}>
                  <Text style={styles.dateLabel}>Last Paid</Text>
                  <Text style={styles.dateValue}>{formatDate(lastPaidDate)}</Text>
                </View>
                <View style={styles.dateDivider} />
                <View style={styles.dateCard}>
                  <Text style={styles.dateLabel}>Next due date</Text>
                  <Text style={styles.dateValue}>{nextDueDate ? formatDate(nextDueDate) : 'Not scheduled'}</Text>
                </View>
                <View style={styles.dateDivider} />
                <View style={styles.dateCard}>
                  <Text style={styles.dateLabel}>Maturity</Text>
                  <Text style={styles.dateValue}>{formatDate(maturityDate)}</Text>
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.buttonsSection}>
                <TouchableOpacity style={styles.viewButton} onPress={() => handleViewDetails(account)} activeOpacity={0.7}>
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
                {isFullyPaid ? (isRedeemed || isMatured ? (
                  <TouchableOpacity style={[styles.fullyPaidBadge, isRedeemed && styles.redeemedBadge]} accessibilityRole="button" disabled={isRedeemed || !redemption} accessibilityState={{ disabled: isRedeemed || !redemption }} onPress={() => {
                    if (!hasReachedMaturity(account.maturityDate) || isRedeemed) return;
                    if (redemption === 'error') setRedemptionRefresh(value => value + 1);
                    else if (redemption === 'available') navigation.navigate('Redemption', { accountData: account });
                  }} activeOpacity={0.7}>
                    <Text style={[styles.fullyPaidText, isRedeemed && styles.redeemedText]}>{isRedeemed ? '✓ Redeemed' : !redemption ? 'Checking…' : redemption === 'error' ? 'Retry Status' : '✓ Redeem Now'}</Text>
                  </TouchableOpacity>
                ) : null) : (
                  <TouchableOpacity
                    style={[styles.payButton, isPaymentDue && styles.payButtonDue, paidThisMonth && styles.payButtonDisabled]}
                    disabled={paidThisMonth}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: paidThisMonth }}
                    onPress={() => handlePayNow(account)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.payButtonText, paidThisMonth && styles.payButtonTextDisabled]}>{paidThisMonth ? 'Paid For This Month' : 'Pay Now'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {userKyc && (userKyc.kycVerified !== true || userKyc.aadhaarVerified !== true) && (
                <TouchableOpacity
                  style={styles.kycButton}
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('PassbookKyc', {
                    account,
                    section: userKyc.kycVerified !== true ? 'address' : 'aadhaar',
                  })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewButtonText}>Pending KYC</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.bottomBorder} />
          </View>
        </View>
      );
    },
    [formatDate, handleViewDetails, handlePayNow, layout, userKyc, navigation, redemptionStatus]
  );

  // Header Component
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeftSection}>
        <Text style={styles.headerTitle}>My Schemes</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{accountCount}</Text>
        </View>
      </View>
      {accounts && accounts.length > 0 && (
        <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading State
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        {layout === 'horizontal' && renderHeader()}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.contentBrand} />
          <Text style={styles.loadingText}>Loading your schemes...</Text>
        </View>
      </View>
    );
  }

  // Error State
  if (error) {
    return (
      <View style={styles.container}>
        {layout === 'horizontal' && renderHeader()}
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load schemes</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty State
  if (!accounts || accounts.length === 0) {
    return (
      <View style={styles.container}>
        {layout === 'horizontal' && renderHeader()}
        <View style={styles.center}>
          <Text style={styles.noAccountText}>No schemes found</Text>
          <Text style={styles.emptySubtext}>You don't have any active schemes yet.</Text>
        </View>
      </View>
    );
  }

  // Empty state for the current filter (data exists, but nothing matches)
  if (!filteredAccounts || filteredAccounts.length === 0) {
    return (
      <View style={styles.container}>
        {layout === 'horizontal' && renderHeader()}
        <View style={styles.center}>
          {accounts.some(account => !redemptionStatus[`${account.groupCode}-${account.regNo}`]) ? (
            <><ActivityIndicator color={COLORS.brand} /><Text style={styles.loadingText}>Checking your schemes…</Text></>
          ) : (
            <><Text style={styles.noAccountText}>{filter === 'all' ? 'No unredeemed schemes' : 'No schemes match this filter'}</Text><Text style={styles.emptySubtext}>View redeemed schemes in Profile → History.</Text></>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, layout === 'vertical' && styles.containerVertical]}>
      {layout === 'horizontal' && renderHeader()}

      {/* Scrollable list */}
      <FlatList
        data={filteredAccounts}
        renderItem={renderAccountCard}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.brand]} tintColor={COLORS.contentBrand} />}
        ListFooterComponent={layout === 'horizontal' ? <View style={styles.footer} /> : null}
        initialNumToRender={layout === 'vertical' ? 5 : 2}
        maxToRenderPerBatch={layout === 'vertical' ? 10 : 3}
        windowSize={layout === 'vertical' ? 10 : 5}
        removeClippedSubviews={true}
        {...listProps}
      />
    </View>
  );
}

// Keep the styles object exactly as it was in your original code
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  containerVertical: {
    paddingBottom: SIZES.space.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.space.lg,
    paddingTop: SIZES.space.xl,
    paddingBottom: SIZES.space.md,
  },
  headerLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.space.sm,
  },
  headerTitle: {
    ...FONTS.title,
    color: COLORS.contentBrand,
  },
  countBadge: {
    backgroundColor: COLORS.brand + '20',
    paddingHorizontal: SIZES.space.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radius.sm,
    borderWidth: 1,
    borderColor: COLORS.borderAccent + '40',
  },
  countText: {
    ...FONTS.label,
    color: COLORS.contentBrand,
    fontSize: SIZES.text.sm,
  },
  viewAllButton: {
    paddingHorizontal: SIZES.space.md,
    paddingVertical: SIZES.space.xs,
  },
  viewAllText: {
    ...FONTS.subheading,
    color: COLORS.contentBrand,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.space.lg,
    marginBottom: SIZES.space.lg,
    padding: SIZES.space.md,
    borderRadius: SIZES.radius.md,
    ...ELEVATION.raised,
    borderWidth: 1,
    borderColor: COLORS.brandAlpha16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.space.xs,
  },
  statValue: {
    ...FONTS.title,
    color: COLORS.contentBrand,
    fontSize: SIZES.text.xl,
    marginBottom: 2,
  },
  statLabel: {
    ...FONTS.caption,
    color: COLORS.contentSecondary,
    fontSize: SIZES.text.xxs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.divider,
  },
  listContainer: {
    paddingHorizontal: SIZES.space.lg,
    paddingBottom: SIZES.space.lg,
  },
  listContainerVertical: {
    paddingHorizontal: SIZES.space.lg,
    paddingBottom: SIZES.space.xl,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
  },
  cardWrapperVertical: {
    width: '100%',
    marginRight: 0,
    marginBottom: SIZES.space.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.card,
    ...ELEVATION.floating,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.brandAlpha16,
  },
  cardVertical: {
    marginHorizontal: 0,
  },
  cardContent: {
    padding: SIZES.space.lg,
  },
  cardContentVertical: {
    padding: SIZES.space.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SIZES.space.sm,
    padding: SIZES.space.md,
    backgroundColor: COLORS.accentTint,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SIZES.space.xs,
  },
  regBadge: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: SIZES.space.md,
    paddingVertical: SIZES.space.xs,
    borderRadius: SIZES.radius.sm,
  },
  regBadgeText: {
    ...FONTS.label,
    color: COLORS.contentOnBrand,
    fontSize: SIZES.text.sm,
  },
  schemeBadge: {
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: SIZES.space.sm,
    paddingVertical: SIZES.space.xs,
    borderRadius: SIZES.radius.sm,
  },
  schemeBadgeText: {
    ...FONTS.caption,
    color: COLORS.black,
    fontSize: SIZES.text.xxs,
    fontWeight: 'bold',
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
    flexShrink: 0,
    paddingHorizontal: SIZES.space.sm,
    paddingVertical: SIZES.space.xs,
    borderRadius: SIZES.radius.sm,
    borderWidth: 1,
    borderColor: '#43A047',
  },
  completedBadgeText: {
    ...FONTS.label,
    color: '#2E7D32',
    fontSize: SIZES.text.md,
    fontFamily: FONTS.family.bold,
  },
  dueBadge: {
    backgroundColor: COLORS.dangerSurface,
    flexShrink: 0,
    paddingHorizontal: SIZES.space.sm,
    paddingVertical: SIZES.space.xs,
    borderRadius: SIZES.radius.sm,
  },
  dueBadgeText: {
    ...FONTS.label,
    color: COLORS.info,
    fontSize: SIZES.text.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.brandAlpha32,
  },
  nameSection: {
    marginBottom: SIZES.space.lg,
  },
  nameText: {
    ...FONTS.title,
    color: COLORS.contentBrand,
    marginBottom: SIZES.space.xs,
  },
  schemeText: {
    ...FONTS.body,
    color: COLORS.contentSecondary,
    fontSize: SIZES.text.md,
    fontFamily: FONTS.family.bold,
    textTransform: 'capitalize',
  },
  memberIdText: {
    ...FONTS.bodyEmphasis,
    color: COLORS.contentBrand,
    marginTop: SIZES.space.xs,
  },
  amountSection: {
    flexDirection: 'row',
    marginBottom: SIZES.space.md,
    gap: SIZES.space.sm,
  },
  amountCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    padding: SIZES.space.sm,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.brandAlpha16,
  },
  amtCard: {
    backgroundColor: COLORS.accentTint,
    borderColor: COLORS.brandAlpha32,
  },
  amountLabel: {
    ...FONTS.caption,
    color: COLORS.contentSecondary,
    marginBottom: SIZES.space.xs,
    fontSize: SIZES.text.xs,
    textAlign: 'center',
    fontFamily: FONTS.family.bold,
  },
  amountValue: {
    ...FONTS.heading,
    color: COLORS.contentBrand,
    fontSize: SIZES.text.md,
    // fontWeight: '700',
    fontFamily: FONTS.family.bold,
  },
  progressSection: {
    marginBottom: SIZES.space.lg,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.space.xs,
  },
  progressLabel: {
    ...FONTS.caption,
    color: COLORS.contentSecondary,
    fontSize: SIZES.text.xs,
    fontFamily: FONTS.family.bold,
  },
  progressCount: {
    ...FONTS.label,
    color: COLORS.contentBrand,
    fontSize: SIZES.text.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.brandAlpha16,
    borderRadius: SIZES.radius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.brand,
    borderRadius: SIZES.radius.sm,
  },
  dateSection: {
    flexDirection: 'row',
    marginBottom: SIZES.space.lg,
    gap: SIZES.space.xs,
  },
  dateCard: {
    flex: 1,
    alignItems: 'center',
  },
  dateDivider: {
    width: 1,
    backgroundColor: COLORS.divider,
  },
  dateLabel: {
    ...FONTS.caption,
    color: COLORS.contentSecondary,
    marginBottom: SIZES.space.xs,
    fontFamily: FONTS.family.bold,
  },
  dateValue: {
    ...FONTS.bodyEmphasis,
    color: COLORS.contentSecondary,
    fontFamily: FONTS.family.bold,
  },
  dueDateSection: {
    alignItems: 'center',
    marginBottom: SIZES.space.lg,
  },
  kycButton: {
    marginTop: SIZES.space.sm,
    minHeight: 44,
    padding: SIZES.space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.borderBrand,
    backgroundColor: COLORS.accentTint,
  },
  buttonsSection: {
    flexDirection: 'row',
    gap: SIZES.space.md,
  },
  buttonsSectionVertical: {
    marginTop: SIZES.space.md,
  },
  viewButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: SIZES.space.md,
    borderRadius: SIZES.radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderAccent,
    ...ELEVATION.raised,
  },
  viewButtonText: {
    // ...FONTS.bodyEmphasis,
    color: COLORS.contentBrand,
    fontSize: SIZES.text.md,
    fontFamily: FONTS.family.bold,
  },
  payButton: {
    flex: 1,
    backgroundColor: COLORS.brand,
    paddingVertical: SIZES.space.md,
    borderRadius: SIZES.radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderAccent,
    ...ELEVATION.raised,
  },
  payButtonDue: {},
  payButtonDisabled: {
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  payButtonTextDisabled: {
    color: COLORS.contentMuted,
  },
  fullyPaidBadge: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    paddingVertical: SIZES.space.md,
    borderRadius: SIZES.radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#43A047',
  },
  fullyPaidText: {
    ...FONTS.bodyEmphasis,
    color: '#2E7D32',
    fontSize: SIZES.text.md,
    fontFamily: FONTS.family.bold,
  },
  redeemedBadge: {
    backgroundColor: COLORS.dangerSurface,
    borderColor: COLORS.dangerText,
  },
  redeemedText: {
    color: COLORS.dangerText,
  },
  payButtonText: {
    ...FONTS.bodyEmphasis,
    color: COLORS.contentOnBrand,
    fontSize: SIZES.text.md,
    fontFamily: FONTS.family.bold,
  },
  bottomBorder: {
    height: 3,
    backgroundColor: COLORS.brand,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.space.gutter,
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.contentSecondary,
    marginTop: SIZES.space.md,
  },
  errorText: {
    ...FONTS.body,
    color: COLORS.danger,
    marginBottom: SIZES.space.md,
  },
  retryButton: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: SIZES.space.xl,
    paddingVertical: SIZES.space.md,
    borderRadius: SIZES.radius.md,
  },
  retryButtonText: {
    ...FONTS.bodyEmphasis,
    color: COLORS.contentOnBrand,
  },
  noAccountText: {
    ...FONTS.title,
    color: COLORS.contentPrimary,
    marginBottom: SIZES.space.sm,
  },
  emptySubtext: {
    ...FONTS.body,
    color: COLORS.contentSecondary,
    marginBottom: SIZES.space.lg,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: SIZES.space.xl,
    paddingVertical: SIZES.space.md,
    borderRadius: SIZES.radius.md,
  },
  createButtonText: {
    ...FONTS.bodyEmphasis,
    color: COLORS.contentOnBrand,
  },
  footer: {
    width: SIZES.space.lg,
  },
});
