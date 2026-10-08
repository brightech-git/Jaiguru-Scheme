import React, { useRef, useState } from "react";
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
import CommonHeader from "../../Components/CommonHeader/CommonHeader";
import PremiumBackground from "../../Components/PremiumBackground/PremiumBackground";
import { AppText } from "../../Components/ui/appcomponents";
import { useMySchemes } from "../../api/hooks/Account/useMySchemes";
import { redemptionService } from "../../api/services/redemptionService";
import type { Account } from "../../types/Account/Account";
import { COLORS, SIZES,FONTS } from "../../Utills/AppTheme";

const instructions = [
  "When you are ready to redeem, click Redeem Now below.",
  "You will get an OTP to confirm that you are redeeming.",
  "Do not share your OTP with anyone.",
  null, // step 4 rendered separately with inline color
  "Once your OTP is verified, the passbook will be moved to the History page in My Profile in The App.",
  null, // step 6 rendered separately with inline color
];
const numeric = (value: unknown) => {
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : 0;
};
const money = (value: number) =>
  `₹ ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value?: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  return match && !value?.startsWith("1900-01-01")
    ? `${match[3]}-${match[2]}-${match[1]}`
    : "Not available";
};
function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <AppText variant="captionBold" color={COLORS.contentSecondary}>
        {label}
      </AppText>
      <AppText variant="bodyBold" style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}

export default function Redeematstore() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [sendingOtp, setSendingOtp] = useState(false);
  const [sendError, setSendError] = useState("");
  const sendPending = useRef(false);
  const initial: Account | undefined = route.params?.accountData;
  const { accounts, loading, error, refetch } = useMySchemes();
  const current = accounts.find(
    (item) =>
      item.regNo === initial?.regNo && item.groupCode === initial?.groupCode,
  );
  const account = current || initial;
  const scheme = account?.schemeSummary;
  const paid = numeric(scheme?.schemaSummaryTransBalance?.amtrecd);
  const weight = numeric(scheme?.totalWeight);
  const total = numeric(scheme?.instalment);
  const installments = numeric(scheme?.schemaSummaryTransBalance?.insPaid);
  const closeDate =
    account?.schemeClosedSummary?.doClose ||
    account?.schemeClosedSummary?.closeDate;
  const closed = !!closeDate && !closeDate.startsWith("1900-01-01");
  const eligible =
    !!current &&
    !loading &&
    !error &&
    total > 0 &&
    installments >= total &&
    !closed;
  const redeem = async () => {
    if (!eligible || !account || sendPending.current) return;
    sendPending.current = true;
    setSendingOtp(true);
    setSendError("");
    try {
      const response = await redemptionService.sendOtp({
        groupCode: account.groupCode,
        regNo: Number(account.regNo),
      });
      if (typeof response.mobile !== "string" || !response.mobile.trim()) {
        throw new Error("OTP response did not include a mobile number. Please contact support.");
      }
      navigation.navigate("RedemptionOtp", {
        accountData: account,
        mobile: response.mobile.trim(),
      });
    } catch (error: any) {
      setSendError(error?.message || "Unable to send OTP. Please try again.");
    } finally {
      sendPending.current = false;
      setSendingOtp(false);
    }
  };

  return (
    <View style={styles.root}>
      <PremiumBackground />
      <CommonHeader
        title="Redeem at Store"
        showBack
        transparent
        borderBottom={false}
        shadow={false}
      />
      <SafeAreaView edges={["bottom"]} style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="h4" style={styles.heading} color={COLORS.brand}>
            Store Redemption Process
          </AppText>
          <View style={styles.instructions}>
            {instructions.map((text, index) => (
              <View key={index} style={styles.step}>
                <View style={styles.stepNumber}>
                  <AppText variant="captionBold" color={COLORS.brand}>
                    {index + 1}
                  </AppText>
                </View>
                {index === 3 ? (
                  <AppText
                    variant="bodyBold"
                    style={styles.stepText}
                    color={COLORS.contentSecondary}
                  >
                    {"After your OTP is verified, you will get a "}
                    <AppText variant="bodyBold" color={COLORS.brand}>
                      {"Closing Slip No"}
                    </AppText>
                    {
                      ". Share this code with the salesperson to redeem your scheme."
                    }
                  </AppText>
                ) : index === 5 ? (
                  <AppText
                    variant="bodyBold"
                    style={styles.stepText}
                    color={COLORS.contentSecondary}
                  >
                    {"You can find the "}
                    <AppText variant="bodyBold" color={COLORS.brand}>
                      {"Closing Slip No"}
                    </AppText>
                    {" in the History page by opening your redeemed scheme."}
                  </AppText>
                ) : (
                  <AppText
                    variant="bodyBold"
                    style={styles.stepText}
                    color={COLORS.contentSecondary}
                  >
                    {text}
                  </AppText>
                )}
              </View>
            ))}
          </View>
          <View style={styles.note}>
            <AppText variant="bodyBold" color={COLORS.brand}>
              Please note
            </AppText>
            <AppText variant="bodyBold" style={styles.noteText}>
              Minimum purchase weight of the product should be above or equal to the total
              Accumulated weight. Benefits will not be applicable for Pre-Closure of
              the scheme before maturity.
            </AppText>
          </View>
          <AppText variant="h4" color={COLORS.brand} style={styles.heading}>
            Your Scheme Summary
          </AppText>
          {account ? (
            <View style={styles.card}>
              <LinearGradient
                colors={[COLORS.brandDeep, COLORS.brand]}
                style={styles.cardHeader}
              >
                <AppText variant="bodyBold" color={COLORS.contentOnBrand}>
                  {(
                    scheme?.schemeSName ||
                    scheme?.schemeName ||
                    "YOUR SCHEME"
                  ).toUpperCase()}
                </AppText>
              </LinearGradient>
              <View style={styles.cardBody}>
                <AppText variant="h4" color={COLORS.brand}>
                  {scheme?.schemeName || "Savings scheme"}
                </AppText>
                <AppText
                  variant="captionBold"
                  color={COLORS.contentSecondary}
                  style={styles.value}
                >
                  {account.groupCode}-{account.regNo}
                </AppText>
                <View style={styles.row}>
                  <Field label="Total Amount Paid" value={money(paid)} />
                  <Field
                    label="Average Rate / g"
                    value={weight > 0 ? money(paid / weight) : "Not available"}
                  />
                </View>
                <View style={styles.row}>
                  {/* <Field
                    label="Saved Weight"
                    value={`${weight.toFixed(3)} g`}
                  /> */}
                  {/* <Field label="Benefit on Maturity" value="To be confirmed" /> */}
                </View>
              </View>
              <View style={styles.reward}>
                
                <View style={styles.goldBadge}>
                  <AppText variant="captionBold" color={COLORS.brandDeep}>
                    Total Gold Accumulated
                  </AppText>
                  <AppText variant="bodyBold" color={COLORS.brandDeep}>
                    {weight.toFixed(3)} g
                  </AppText>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.row}>
                  <Field
                    label="Date of Joining"
                    value={date(account.joinDate)}
                  />
                  <Field
                    label="Date of Maturity"
                    value={date(account.maturityDate)}
                  />
                </View>
                <View style={styles.row}>
                  <Field
                    label="Member Name"
                    value={account.pName || "Not available"}
                  />
                  <Field
                    label="Mobile Number"
                    value={
                      account.personalInfo?.mobile ||
                      route.params?.mobile ||
                      "Not available"
                    }
                  />
                </View>
              </View>
            </View>
          ) : (
            <AppText>
              No scheme selected. Please go back and select your scheme.
            </AppText>
          )}
          {loading && (
            <ActivityIndicator color={COLORS.brand} style={styles.status} />
          )}
          {!!error && (
            <Pressable onPress={refetch} style={styles.status}>
              <AppText color={COLORS.brand}>
                Unable to verify your scheme. Tap to retry.
              </AppText>
            </Pressable>
          )}
          {!loading && !error && account && !eligible && (
            <AppText
              variant="bodySmall"
              color={COLORS.contentSecondary}
              style={styles.status}
            >
              Redemption is available for a fully paid, active scheme after
              verification.
            </AppText>
          )}
          {!!sendError && <View accessibilityLiveRegion="polite" style={styles.status}><AppText variant="bodySmall" color={COLORS.brand}>{sendError}</AppText></View>}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !eligible || sendingOtp, busy: sendingOtp }}
            disabled={!eligible || sendingOtp}
            onPress={redeem}
            style={[styles.button, (!eligible || sendingOtp) && styles.disabled]}
          >
            <AppText variant="button" color={COLORS.contentOnBrand}>
              {sendingOtp ? "SENDING OTP…" : "REDEEM NOW"}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.cancel}
          >
            <AppText variant="bodyMedium" color={COLORS.contentSecondary}>
              Cancel
            </AppText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.accentTint },
  safe: { flex: 1 },
  content: { padding: SIZES.space.lg, paddingBottom: SIZES.space.xl },
  heading: { textAlign: "center", marginVertical: SIZES.space.lg },
  instructions: { gap: SIZES.space.lg },
  step: { flexDirection: "row", gap: SIZES.space.sm, alignItems: "flex-start" },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.brandAlpha08,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { flex: 1, lineHeight: 23 },
  note: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: SIZES.radius.md,
    padding: SIZES.space.md,
    marginTop: SIZES.space.lg,
  },
  noteText: { marginTop: SIZES.space.xs, lineHeight: 21 },
  card: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: SIZES.radius.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.accentAlpha32,
  },
  cardHeader: { padding: SIZES.space.md, alignItems: "center" },
  cardBody: { padding: SIZES.space.md },
  row: { flexDirection: "row", gap: SIZES.space.md, marginTop: SIZES.space.md },
  field: { flex: 1 },
  value: { marginTop: SIZES.space.xs },
  reward: {
    backgroundColor: COLORS.brand,
    padding: SIZES.space.md,
    flexDirection: "column",
    alignItems: "center",
    gap: SIZES.space.sm,
  },
  rewardLabel: { flex: 1 },
  goldBadge: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.space.sm,
    alignItems: "center",
  },
  status: { marginTop: SIZES.space.md },
  button: {
    marginTop: SIZES.space.xl,
    padding: SIZES.space.lg,
    backgroundColor: COLORS.brand,
    borderRadius: SIZES.radius.md,
    alignItems: "center",
  },
  disabled: { opacity: 0.45 },
  cancel: { padding: SIZES.space.lg, alignItems: "center" },
});
