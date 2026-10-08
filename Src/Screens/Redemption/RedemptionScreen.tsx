import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CommonHeader from "../../Components/CommonHeader/CommonHeader";
import PremiumBackground from "../../Components/PremiumBackground/PremiumBackground";
import { AppCard, AppText } from "../../Components/ui/appcomponents";
import { useMySchemes } from "../../api/hooks/Account/useMySchemes";
import { getUserData } from "../../Utills/AsynchStorageHelper";
import type { Account } from "../../types/Account/Account";
import { COLORS, FONTS, SIZES } from "../../Utills/AppTheme";

const number = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};
const money = (value: number) =>
  `₹ ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateLabel = (value?: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  return match && !value?.startsWith("1900-01-01")
    ? `${match[3]}-${match[2]}-${match[1]}`
    : "Not available";
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <AppText variant="caption" color={COLORS.contentMuted}>
        {label}
      </AppText>
      <AppText
        variant="bodyMedium"
        color={COLORS.contentPrimary}
        style={styles.detailValue}
      >
        {value}
      </AppText>
    </View>
  );
}

export default function RedemptionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initial: Account | undefined = route.params?.accountData;
  const { accounts, loading, error, refetch } = useMySchemes();
  const [phone, setPhone] = useState("");
  useEffect(() => {
    let active = true;
    getUserData()
      .then((user) => {
        if (active)
          setPhone(
            user?.contactNumber || user?.mobileNumber || user?.mobile || "",
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const current = accounts.find(
    (account) =>
      account.regNo === initial?.regNo &&
      account.groupCode === initial?.groupCode,
  );
  const account = current || initial;
  if (!account)
    return (
      <View style={styles.root}>
        <CommonHeader title="Scheme Redemption" />
        <AppText style={styles.content}>
          No scheme selected. Go back and choose your completed scheme.
        </AppText>
      </View>
    );
  const scheme = account.schemeSummary;
  const paid = number(scheme?.schemaSummaryTransBalance?.insPaid);
  const total = number(scheme?.instalment);
  const fullyPaid = total > 0 && paid >= total;
  const closeDate =
    account.schemeClosedSummary?.doClose ||
    account.schemeClosedSummary?.closeDate;
  const closed = !!closeDate && !closeDate.startsWith("1900-01-01");
  const paidAmount = number(scheme?.schemaSummaryTransBalance?.amtrecd);
  const plannedAmount =
    total > 0 && number(account.amount) > 0
      ? total * number(account.amount)
      : number(account.totalAmount);
  const weight = number(scheme?.totalWeight);
  const mobile = account.personalInfo?.mobile || phone || "Not available";
  const canRedeem = !loading && !error && !!current && fullyPaid && !closed;
  const redeem = () => {
    if (!canRedeem) return;
    navigation.navigate("Redeematstore", { accountData: account, mobile });
  };

  return (
    <View style={styles.root}>
      <PremiumBackground />
      <CommonHeader
        title="Scheme Redemption"
        showBack
        transparent
        borderBottom={false}
        shadow={false}
      />
      <SafeAreaView edges={["bottom"]} style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[COLORS.brandDeep, COLORS.brandStrong, COLORS.brand]}
            style={styles.hero}
          >
            <View style={styles.medallion}>
              <MaterialCommunityIcons
                name="diamond-stone"
                size={36}
                color={COLORS.accentDeep}
              />
            </View>
            <AppText
              variant="captionBold"
              color={COLORS.accentStrong}
              align="center"
              style={styles.eyebrow}
            >
              YOUR GOLDEN JOURNEY
            </AppText>
            <AppText variant="h4" color={COLORS.contentOnBrand} align="center">
              A moment to treasure
            </AppText>
            <AppText
              variant="bodySmall"
              color={COLORS.whiteAlpha80}
              align="center"
              style={styles.heroCopy}
            >
              {scheme?.schemeName || "Your jewellery savings scheme"}
            </AppText>
            <View style={styles.status}>
              <MaterialCommunityIcons
                name={
                  closed
                    ? "lock-outline"
                    : fullyPaid
                      ? "check-circle-outline"
                      : "clock-outline"
                }
                size={16}
                color={COLORS.accentTint}
              />
              <AppText variant="captionBold" color={COLORS.accentTint}>
                {closed
                  ? "Scheme closed"
                  : fullyPaid
                    ? "All installments paid"
                    : "Payments pending"}
              </AppText>
            </View>
            <AppText
              variant="bodyBold"
              color={COLORS.whiteAlpha80}
              align="center"
            >
              {account.groupCode}-{account.regNo}
            </AppText>
            {/* <AppText variant="caption" color={COLORS.whiteAlpha80} align="center">{dateLabel(account.maturityDate)}</AppText> */}
            <View style={styles.infoCol1}>
              <AppText variant="bodyBold" color={COLORS.white}>
                Date of Maturity -
              </AppText>
              <AppText variant="bodyBold" color={COLORS.accentStrong}>
                {dateLabel(account.maturityDate)}
              </AppText>
            </View>
          </LinearGradient>
          <View style={styles.summary}>
            <AppCard style={styles.stat}>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={23}
                color={COLORS.brand}
              />
              <AppText variant="captionBold" color={COLORS.contentMuted}>
                Total paid
              </AppText>
              <AppText
                variant="bodyBold"
                color={COLORS.brand}
                style={styles.statValue}
              >
                {money(paidAmount)}
              </AppText>
            </AppCard>
            <AppCard style={styles.stat}>
              <MaterialCommunityIcons
                name="gold"
                size={23}
                color={COLORS.brand}
              />
              <AppText variant="captionBold" color={COLORS.contentMuted}>
                Accumulated weight
              </AppText>
              <AppText
                variant="bodyBold"
                color={COLORS.brand}
                style={styles.statValue}
              >
                {scheme?.totalWeight != null
                  ? `${weight.toFixed(3)} g`
                  : "Not available"}
              </AppText>
            </AppCard>
          </View>

          <AppCard style={styles.infoCard}>
            <AppText
              variant="bodyBold"
              color={COLORS.brand}
              style={{ marginBottom: SIZES.space.sm }}
            >
              Member & scheme details
            </AppText>
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <AppText variant="captionBold" color={COLORS.contentMuted}>
                  Member name
                </AppText>
                <AppText variant="bodyBold" color={COLORS.contentPrimary}>
                  {account.pName || "Not available"}
                </AppText>
              </View>
              <View style={styles.infoCol}>
                <AppText variant="captionBold" color={COLORS.contentMuted}>
                  Mobile number
                </AppText>
                <AppText variant="bodyBold" color={COLORS.contentPrimary}>
                  {mobile}
                </AppText>
              </View>
            </View>
            <View style={[styles.infoRow, { marginBottom: 0 }]}>
              <View style={styles.infoCol}>
                <AppText variant="captionBold" color={COLORS.contentMuted}>
                  Date of joining
                </AppText>
                <AppText variant="bodyBold" color={COLORS.contentPrimary}>
                  {dateLabel(account.joinDate)}
                </AppText>
              </View>
              <View style={styles.infoCol}>
                <AppText variant="captionBold" color={COLORS.contentMuted}>
                  Date of Maturity
                </AppText>
                <AppText variant="bodyBold" color={COLORS.contentPrimary}>
                  {dateLabel(account.maturityDate)}
                </AppText>
              </View>
            </View>
          </AppCard>
          {loading && (
            <View style={styles.notice}>
              <ActivityIndicator color={COLORS.brand} />
              <AppText variant="caption">
                Checking latest payment details...
              </AppText>
            </View>
          )}
          {error && (
            <View style={styles.notice}>
              <AppText variant="bodySmall">
                Unable to verify the latest payments.
              </AppText>
              <Pressable onPress={refetch} accessibilityRole="button">
                <AppText variant="bodyBold" color={COLORS.brand}>
                  Retry
                </AppText>
              </Pressable>
            </View>
          )}
          {!loading && !error && !current && (
            <AppText variant="bodySmall" color={COLORS.dangerText}>
              This scheme could not be found in your latest account details.
            </AppText>
          )}
          <View style={styles.redeemNote}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={22}
              color={COLORS.brand}
            />
            <AppText
              variant="bodySmall"
              color={COLORS.contentSecondary}
              style={styles.noteText}
            >
              Redemption is subject to the scheme’s maturity date and terms.
              Bring your scheme details and identity proof to the showroom.
            </AppText>
          </View>
          <Pressable
            onPress={redeem}
            disabled={!canRedeem}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canRedeem }}
            style={[styles.redeemButton, !canRedeem && styles.disabled]}
          >
            <MaterialCommunityIcons
              name="diamond-stone"
              size={22}
              color={COLORS.contentOnBrand}
            />
            <AppText variant="button" color={COLORS.contentOnBrand}>
              {closed
                ? "Scheme Closed"
                : fullyPaid
                  ? "Redeem At Store"
                  : "Complete Payments to Redeem"}
            </AppText>
            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color={COLORS.contentOnBrand}
            />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surfacePage },
  body: { flex: 1 },
  content: { padding: SIZES.space.gutter },
  hero: {
    borderRadius: SIZES.radius.xxl,
    padding: SIZES.space.xxl,
    alignItems: "center",
    gap: SIZES.space.sm,
  },
  medallion: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: COLORS.accentAlpha32,
    backgroundColor: COLORS.whiteAlpha10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SIZES.space.sm,
  },
  eyebrow: { letterSpacing: 1.5, fontSize: 9 },
  heroCopy: { lineHeight: 22, fontFamily: FONTS.family.bold, fontSize: 15 },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: SIZES.radius.pill,
    paddingHorizontal: SIZES.space.md,
    paddingVertical: SIZES.space.sm,
    backgroundColor: COLORS.whiteAlpha10,
    marginTop: SIZES.space.sm,
  },
  summary: {
    flexDirection: "row",
    gap: SIZES.space.sm,
    marginVertical: SIZES.space.lg,
  },
  stat: { flex: 1, gap: SIZES.space.sm },
  statValue: { fontSize: 17, lineHeight: 25 },
  card: {
    marginBottom: SIZES.space.lg,
    flexDirection: "row",
    gap: SIZES.space.md,
    padding: SIZES.space.lg,
  },
  infoCard: { marginBottom: SIZES.space.lg, padding: SIZES.space.lg },
  infoRow: {
    flexDirection: "row",
    gap: SIZES.space.md,
    marginBottom: SIZES.space.md,
  },
  infoCol: { flex: 1, gap: 4 },
  infoCol1: { flex: 1, gap: 4, flexDirection: "row", justifyContent: "center" },
  detail: {
    paddingVertical: SIZES.space.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    gap: 4,
  },
  detailValue: { fontSize: 14, lineHeight: 22 },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentSoft,
    marginTop: SIZES.space.lg,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: COLORS.brand, borderRadius: 3 },
  notice: {
    alignItems: "center",
    gap: SIZES.space.sm,
    padding: SIZES.space.md,
  },
  redeemNote: {
    flexDirection: "row",
    gap: SIZES.space.sm,
    paddingVertical: SIZES.space.md,
  },
  noteText: {
    flex: 1,
    lineHeight: 21,
    fontFamily: FONTS.family.bold,
    fontSize: 13,
    color: COLORS.contentSecondary,
  },
  redeemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SIZES.space.sm,
    backgroundColor: COLORS.brand,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.space.lg,
    marginTop: SIZES.space.sm,
    minHeight: 54,
  },
  disabled: { opacity: 0.45 },
});
