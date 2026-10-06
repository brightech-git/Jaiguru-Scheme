import React, { useCallback } from "react";
import { BackHandler, StyleSheet, View } from "react-native";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import Animated, {
  Easing,
  FadeInDown,
  ReduceMotion,
} from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import {
  AppButton,
  AppCard,
  AppText,
  ScreenWrapper,
} from "../../Components/ui/appcomponents";
import theme from "../../Utills/AppTheme";
import { SchemeJoinSuccessDetails, buildSchemeJoinSuccess } from "./schemeJoinSuccess";

const { COLORS, SIZES } = theme;
type SuccessRoute = RouteProp<
  { SchemeJoinSuccess: { details: SchemeJoinSuccessDetails; processResult?: unknown } },
  "SchemeJoinSuccess"
>;
const enter = (delay: number) =>
  FadeInDown.duration(280)
    .delay(delay)
    .easing(Easing.bezier(0.23, 1, 0.32, 1))
    .reduceMotion(ReduceMotion.System);

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <AppText variant="captionBold" color={COLORS.contentSecondary}>
        {label}
      </AppText>
      <AppText variant="captionBold" style={styles.detailValue}>
        {value}
      </AppText>
    </View>
  );
}

export default function SchemeJoinSuccessScreen() {
  const { params } = useRoute<SuccessRoute>();
  const navigation = useNavigation<any>();
  const details = params.processResult != null ? buildSchemeJoinSuccess(params.processResult, params.details) : params.details;
  const goHome = useCallback(
    () => navigation.reset({ index: 0, routes: [{ name: "MainDrawer" }] }),
    [navigation],
  );
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          goHome();
          return true;
        },
      );
      return () => subscription.remove();
    }, [goHome]),
  );
  const date =
    details.joinDate && /^\d{4}-\d{2}-\d{2}$/.test(details.joinDate)
      ? new Date(`${details.joinDate}T00:00:00`).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : details.joinDate;

  return (
    <ScreenWrapper
      scroll
      paddingTop={SIZES.space.xxl}
      paddingBottom={SIZES.space.xxl}
      footer={
        <View style={styles.footer}>
          <AppButton
            label="Continue to home"
            rightIcon="arrow-forward"
            onPress={goHome}
          />
        </View>
      }
    >
      <Animated.View entering={enter(0)}>
        <LinearGradient
          colors={COLORS.gradient.accent as [string, string]}
          style={styles.hero}
        >
          <View
            style={styles.check}
            accessible
            accessibilityLabel="Payment verified and scheme joined successfully"
          >
            <Ionicons
              name="checkmark"
              size={48}
              color={COLORS.white}
            />
          </View>
          <AppText
            variant="labelUppercase"
            color={COLORS.contentBrand}
            align="center"
          >
            Payment successful
          </AppText>
          <AppText variant="h3" align="center" color={COLORS.contentBrand}>
            Congratulations, {details.userName}!
          </AppText>
          <AppText variant="captionBold" align="center">
            Welcome to {details.schemeName}, Your Payment Is Verified.
          </AppText>
          <AppText variant="bodyBold" align="center">
          Scheme Membership Code {' '}
          <AppText variant="h3" color={COLORS.contentBrand}>
            {[details.groupCode, details.regNo].filter(Boolean).join('-') || 'Confirmed'}
          </AppText>
          </AppText>
        </LinearGradient>
      </Animated.View>
      <Animated.View entering={enter(100)} style={styles.section}>
        <AppCard variant="flat">
          <AppText
            variant="captionBold"
            align="center"
            color={COLORS.contentSecondary}
          >
            Amount paid
          </AppText>
          <AppText variant="h2" align="center" color={COLORS.contentBrand}>
            ₹{" "}
            {details.amount.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </AppText>
          {details.goldWeight !== undefined && <View style={styles.goldSummary}>
            <Ionicons name="sparkles-outline" size={24} color={COLORS.contentBrand} />
            <AppText variant="captionBold" align="center" color={COLORS.contentSecondary}>Gold saved with this payment</AppText>
            <AppText variant="h2" align="center" color={COLORS.contentBrand}>{details.goldWeight.toFixed(4)} g</AppText>
          </View>}
          <View style={styles.verified}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={COLORS.successText}
            />
            <AppText variant="captionBold" color={COLORS.successText}>
              Payment verified
            </AppText>
          </View>
          <DetailRow label="Receipt number" value={details.receiptNo} />
          <DetailRow label="Installment" value={details.installment} />
          <DetailRow label="Gold rate / gram" value={details.goldRate !== undefined ? '? ' + details.goldRate.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : undefined} />
          <DetailRow label="Member name" value={details.userName} />
          <DetailRow label="Scheme" value={details.schemeName} />
          <DetailRow label="Member ID" value={details.personalId} />
          <DetailRow label="Registration number" value={details.regNo} />
          <DetailRow label="Group" value={details.groupCode} />
          <DetailRow label="Joined on" value={date} />
          <DetailRow label="Scheme reference" value={details.sno} />
          <DetailRow label="Payment method" value="Online" />
        </AppCard>
      </Animated.View>
      <Animated.View entering={enter(200)} style={styles.section}>
        <AppText
          variant="captionBold"
          align="center"
          color={COLORS.contentSecondary}
        >
          Thank you for choosing Jaiguru Jewellers. Your journey towards
          something special starts here.
        </AppText>
      </Animated.View>
    </ScreenWrapper>
  );
}
const styles = StyleSheet.create({
  goldSummary: { marginTop: SIZES.space.lg, padding: SIZES.space.lg, borderRadius: SIZES.radius.card, backgroundColor: COLORS.accentTint, alignItems: "center", gap: SIZES.space.sm },
  hero: {
    borderRadius: SIZES.radius.card,
    padding: SIZES.space.xxl,
    alignItems: "center",
    gap: SIZES.space.md,
  },
  check: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.space.sm,
  },
  section: { marginTop: SIZES.space.xl },
  verified: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SIZES.space.xs,
    marginTop: SIZES.space.sm,
    marginBottom: SIZES.space.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SIZES.space.md,
    paddingVertical: SIZES.space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
  },
  detailValue: { flex: 1, textAlign: "right" },
  footer: {
    padding: SIZES.space.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
  },
});
