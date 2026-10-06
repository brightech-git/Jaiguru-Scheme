import React, { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  cancelAnimation,
  withTiming,
  Easing,
  useReducedMotion,
  interpolate,
  interpolateColor,
  runOnJS,
} from "react-native-reanimated";
import CommonHeader from "../../Components/CommonHeader/CommonHeader";
import {
  AppButton,
  AppEmptyState,
  AppProgressBar,
  AppText,
  ScreenWrapper,
} from "../../Components/ui/appcomponents";
import { Account, PaymentHistoryItem } from "../../types/Account/Account";
import theme from "../../Utills/AppTheme";
import PassbookSummaryCard, {
  PassbookSummaryRow,
} from "./components/PassbookSummaryCard";
import PassbookMetricCard from "./components/PassbookMetricCard";
import PassbookHistoryTable from "./components/PassbookHistoryTable";
import SchemeNameCarousel from "./components/SchemeNameCarousel";
import { dateLabel, money, paidThisMonth, toNumber } from "./passbookUtils";

const { COLORS, SIZES } = theme;
type Tab = "history" | "details" | "overview";
interface RouteParams {
  schemeData?: Account | Account[];
  fromScreen?: string;
}

function PassbookStatusBadge({ status }: { status: string }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  React.useEffect(() => {
    cancelAnimation(opacity);
    opacity.set(1);
    if (status === "Active" && !reducedMotion) {
      opacity.set(
        withRepeat(
          withTiming(0.3, { duration: 800, easing: Easing.bezier(0.77, 0, 0.175, 1) }),
          -1,
          true,
        ),
      );
    }
    return () => cancelAnimation(opacity);
  }, [status, reducedMotion, opacity]);
  const blinkStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return (
    <Animated.View style={[styles.status, blinkStyle]}>
      <AppText variant="captionBold" color={COLORS.white}>
        {status}
      </AppText>
    </Animated.View>
  );
}

function GoldBadge() {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  React.useEffect(() => {
    if (reducedMotion) return;
    opacity.set(
      withRepeat(
        withTiming(0.3, { duration: 800, easing: Easing.bezier(0.77, 0, 0.175, 1) }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [reducedMotion, opacity]);
  const blinkStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return (
    <Animated.View style={[styles.goldBadge, blinkStyle]}>
      <AppText variant="captionBold" color={COLORS.accentDeep}>
        GOLD
      </AppText>
    </Animated.View>
  );
}

export default function SchemePassbook() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams | undefined;
  const data = Array.isArray(params?.schemeData)
    ? params.schemeData[0]
    : params?.schemeData;
  const [tab, setTab] = useState<Tab>("history");

  const goBack = () =>
    params?.fromScreen === "payment"
      ? navigation.navigate("AllSchemes")
      : navigation.goBack();
  if (!data)
    return (
      <ScreenWrapper
        header={<CommonHeader title="Scheme passbook" onBackPress={goBack} />}
        edges={["bottom"]}
      >
        <AppEmptyState
          title="No scheme data available"
          actionLabel="Go back"
          onAction={goBack}
        />
      </ScreenWrapper>
    );
  const scheme = data.schemeSummary;
  const personal = data.personalInfo;
  const paid = toNumber(scheme?.schemaSummaryTransBalance?.insPaid);
  const total = toNumber(scheme?.instalment);
  const invested = toNumber(scheme?.schemaSummaryTransBalance?.amtrecd);
  const amount = toNumber(data.amount);
  const weight = toNumber(scheme?.totalWeight);
  const flexible = scheme?.fixedIns === "N" && total > 1;
  const hasWeight =
    scheme?.weightLedger === "Y" ||
    weight > 0 ||
    (data.paymentHistoryList || []).some((p) => toNumber(p.weight) > 0);
  const closed =
    !!data.schemeClosedSummary?.doClose &&
    !data.schemeClosedSummary.doClose.startsWith("1900-01-01");
  const completed = !flexible && total > 0 && paid >= total;
  const thisMonthPaid = paidThisMonth(data.lastPaidDate);
  const now = new Date();
  const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const due =
    !closed &&
    !completed &&
    !!data.nextDueDate &&
    data.nextDueDate.slice(0, 10) <= todayDate;
  const status = closed
    ? "Closed"
    : completed
      ? "Completed"
      : due && !thisMonthPaid
        ? "Payment due"
        : "Active";
  const canPay = !closed && !completed && !thisMonthPaid;
  const remaining = Math.max(0, total - paid) * amount;
  const address = [
    personal?.doorNo,
    personal?.address1,
    personal?.address2,
    personal?.area,
    personal?.city,
    personal?.state,
    personal?.pinCode,
  ]
    .filter(Boolean)
    .join(", ");
  const details: PassbookSummaryRow[] = [
    { label: "Member", value: data.pName },
    {
      label: "Member ID",
      value:
        personal?.personalId != null ? String(personal.personalId) : undefined,
    },
    { label: "Registration no.", value: String(data.regNo) },
    { label: "Group code", value: data.groupCode },
    { label: "Scheme", value: scheme?.schemeName },
    { label: "Joined", value: dateLabel(data.joinDate) },
    { label: "Matures", value: dateLabel(data.maturityDate) },
    { label: "Next due", value: dateLabel(data.nextDueDate) },
    {
      label: "Mobile",
      value: [
        personal?.mobile,
        personal?.mobile2 !== personal?.mobile ? personal?.mobile2 : undefined,
      ]
        .filter(Boolean)
        .join(" · "),
    },
    { label: "Address", value: address },
  ];
  const overview: PassbookSummaryRow[] = flexible
    ? [
        { label: "Total Paid", value: money(invested) },
        ...(hasWeight
          ? [{ label: "Gold Accumulated", value: `${weight.toFixed(4)} g` }]
          : []),
        { label: "Last payment", value: dateLabel(data.lastPaidDate) },
        {
          label: "Total payments",
          value: String(data.paymentHistoryList?.length || 0),
        },
      ]
    : [
        { label: "Installments paid", value: `${paid} of ${total || "—"}` },
        { label: "Per installment", value: money(amount) },
        { label: "Amount received", value: money(invested) },
        {
          label: "Still to pay",
          value: completed ? "Fully paid" : money(remaining),
          highlight: remaining > 0,
        },
        { label: "Total commitment", value: money(total * amount) },
      ];
  const onReceipt = (payment: PaymentHistoryItem) =>
    navigation.navigate("PaymentReceipt", {
      paymentData: payment,
      schemeData: data,
      customerData: { pName: data.pName, mobile: personal?.mobile, address },
    });
  const onPay = () => {
    if (!canPay || paidThisMonth(data.lastPaidDate)) return;
    navigation.navigate("Paynow", {
      accountData: data,
      fromScreen: "SchemePassbook",
      regNo: data.regNo,
      groupCode: data.groupCode,
      memberName: data.pName,
      schemeName: scheme?.schemeName,
      schemeShortName: scheme?.schemeSName,
      schemeId: scheme?.schemeId,
      totalAmount: data.totalAmount || 0,
      amount,
      nextDueDate: data.nextDueDate,
      installmentsPaid: String(paid),
      totalInstallments: String(total),
      joinDate: data.joinDate,
      maturityDate: data.maturityDate,
    });
  };

  return (
    <ScreenWrapper
      scroll
      edges={["bottom"]}
      paddingTop={SIZES.space.lg}
      header={
        <CommonHeader
          title="Scheme passbook"
          subtitle={`${data.groupCode}-${data.regNo}`}
          onBackPress={goBack}
        />
      }
      footer={
        !closed && !completed ? (
          <View style={styles.footer}>
            <View style={styles.footerInfo}>
              <AppText variant="caption">
                {flexible ? "Add a payment" : `Next installment (#${paid + 1})`}
              </AppText>
              <AppText variant="h5" color={COLORS.contentBrand}>
                {money(amount)}
              </AppText>
              <AppText variant="caption">
                {thisMonthPaid
                  ? "Your payment for this month is recorded"
                  : data.nextDueDate
                    ? `Due ${dateLabel(data.nextDueDate)}`
                    : "Ready to pay"}
              </AppText>
            </View>
            <AppButton
              label={thisMonthPaid ? "Paid This Month" : "Pay installment"}
              onPress={onPay}
              disabled={!canPay}
              fullWidth={false}
              style={styles.payButton}
            />
          </View>
        ) : undefined
      }
    >
      <SchemeNameCarousel
        memberName={data.pName}
        mobileNumber={personal?.mobile || personal?.mobile2}
        names={(Array.isArray(params?.schemeData) ? params.schemeData : [data])
          .map((account) => ({
            rows: [
              { label: "Scheme Code", value: account.schemeSummary?.schemeSName || "" },
              { label: "Name", value: account.schemeSummary?.schemeName || "" },
              { label: "Mobile", value: account.personalInfo?.mobile || account.personalInfo?.mobile2 || "" },
            ].filter((r) => r.value),
          }))
          .filter((item) => item.rows.length > 0)}
      >
        <LinearGradient
  colors={[
    "#C9A55B",
    "#DBBD79",
    "#F4E2A4",
    "#D3AE62",
    "#C39A4F",
    "#fae59f",
    "#D8B56F",
    "#B98D3D"
  ]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.hero}
>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: SIZES.space.sm,
            }}
          >
            <AppText variant="h4" color={COLORS.contentOnAccent}>
              {scheme?.schemeName || "Your scheme"}
            </AppText>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SIZES.space.xs }}>
              <PassbookStatusBadge status={status} />
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: SIZES.space.sm,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: SIZES.space.sm, flex: 1 }}>
              <AppText variant="h4" color={COLORS.black}>
                {data.pName}
              </AppText>
              <AppText variant="h4" color={COLORS.contentOnAccent}>
                ({data.groupCode} - {data.regNo})
              </AppText>
            </View>
            {hasWeight && <GoldBadge />}
          </View>
          {flexible ? (
            <>
              <AppText variant="captionBold" color={COLORS.contentPrimary}>
                {hasWeight ? "Gold Accumulated" : "Total Paid"}
              </AppText>
              <AppText variant="h2" color={COLORS.contentOnAccent}>
                {hasWeight ? `${weight.toFixed(4)} g` : money(invested)}
              </AppText>
            </>
          ) : (
            <>
              <View style={styles.progressLabels}>
                <AppText variant="caption" color={COLORS.contentSecondary}>
                  Scheme progress
                </AppText>
                <AppText variant="captionBold" color={COLORS.contentOnAccent}>
                  {paid} / {total || "—"}
                </AppText>
              </View>
              <AppProgressBar
                animated={false}
                progress={total > 0 ? (paid / total) * 100 : 0}
                color={COLORS.accentDeep}
                trackColor={COLORS.accentAlpha16}
              />
            </>
          )}
          <AppText variant="captionBold" color={COLORS.contentPrimary}>
            {data.lastPaidDate
              ? `Last paid ${dateLabel(data.lastPaidDate)}`
              : "No payments yet"}
          </AppText>
        </LinearGradient>
      </SchemeNameCarousel>
      <View style={styles.tabs}>
        {(["history", "details", "overview"] as Tab[]).map((key) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            onPress={() => setTab(key)}
            style={[styles.tab, tab === key && styles.selected]}
          >
            <AppText
              variant="captionBold"
              color={
                tab === key ? COLORS.contentBrand : COLORS.contentSecondary
              }
            >
              {key === "history"
                ? `History (${data.paymentHistoryList?.length || 0})`
                : key === "details"
                  ? "Details"
                  : "Overview"}
            </AppText>
          </Pressable>
        ))}
      </View>
      <View style={styles.content}>
        {tab === "history" && (
          <PassbookHistoryTable
            payments={data.paymentHistoryList || []}
            hasWeight={hasWeight}
            onReceipt={onReceipt}
          />
        )}
        {tab === "details" && <PassbookSummaryCard rows={details} />}
        {tab === "overview" && (
          <>
            <View style={styles.metrics}>
              <PassbookMetricCard
                label="Total Paid"
                value={money(invested)}
                caption={`${paid} of ${total || "—"} paid`}
                icon="wallet-outline"
              />
              <PassbookMetricCard
                label={hasWeight ? "Gold Accumulated" : "Time remaining"}
                caption={
                  hasWeight
                    ? `Last ${toNumber(scheme?.lastWeight).toFixed(4)} g`
                    : `Matures ${dateLabel(data.maturityDate)}`
                }
                value={
                  hasWeight
                    ? `${weight.toFixed(4)} g`
                    : `${toNumber(data.remainingDays)} days`
                }
                icon={hasWeight ? "sparkles-outline" : "calendar-outline"}
              />
            </View>
            <PassbookSummaryCard rows={overview} />
            {!!data.remainingDueDates?.length && (
              <PassbookSummaryCard
                rows={data.remainingDueDates.map((date, i) => ({
                  label:
                    i === 0 ? "Next scheduled due" : `Scheduled due ${i + 1}`,
                  value: dateLabel(date),
                }))}
              />
            )}
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}
const styles = StyleSheet.create({
  hero: {
    padding: SIZES.space.xl,
    borderRadius: SIZES.radius.card,
    gap: SIZES.space.sm,
  },
  status: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.success,
    borderRadius: SIZES.radius.pill,
    paddingHorizontal: SIZES.space.md,
    paddingVertical: SIZES.space.xs,
  },
  goldBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.black,
    borderRadius: SIZES.radius.pill,
    paddingHorizontal: SIZES.space.md,
    paddingVertical: SIZES.space.xs,
    borderWidth: 1,
    borderColor: COLORS.accentDeep,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SIZES.space.sm,
  },
  tabs: {
    flexDirection: "row",
    borderRadius: SIZES.radius.control,
    backgroundColor: COLORS.surfaceMuted,
    padding: SIZES.space.xs,
    marginTop: SIZES.space.xl,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: SIZES.radius.control,
  },
  selected: { backgroundColor: COLORS.surface },
  content: { marginTop: SIZES.space.lg, gap: SIZES.space.lg },
  metrics: { flexDirection: "row", gap: SIZES.space.md },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.space.md,
    padding: SIZES.space.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
  },
  footerInfo: { flex: 1, gap: SIZES.space.xs },
  payButton: { flex: 1 },
});
