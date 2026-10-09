import React, { useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  AppCard,
  AppText,
  AppEmptyState,
} from "../../../Components/ui/appcomponents";
import { PaymentHistoryItem } from "../../../types/Account/Account";
import theme from "../../../Utills/AppTheme";
import { dateLabel, money, toNumber } from "../passbookUtils";
export default function PassbookHistoryTable({
  payments,
  hasWeight,
  onReceipt,
}: {
  payments: PaymentHistoryItem[];
  hasWeight: boolean;
  onReceipt: (payment: PaymentHistoryItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { fontScale } = useWindowDimensions();
  const textScale = Math.max(1, fontScale);
  // Use the same non-shrinking widths for headers and values, including
  // devices with larger accessibility text. Extra columns remain scrollable.
  const styles = {
    ...baseStyles,
    action: { ...baseStyles.action, width: 48 * textScale },
    date: { ...baseStyles.date, width: 100 * textScale },
    inst: { ...baseStyles.inst, width: 40 * textScale },
    number: { ...baseStyles.number, width: 100 * textScale },
  };
  const ordered = payments
    .map((payment, index) => ({ payment, index }))
    .sort(
      (a, b) =>
        (b.payment.updateTime || "").localeCompare(
          a.payment.updateTime || "",
        ) || b.index - a.index,
    );
  const visible = expanded ? ordered : ordered.slice(0, 4);
  if (!payments.length)
    return (
      <AppEmptyState
        icon="receipt-outline"
        title="No receipts yet"
        message="Your payments and receipts will appear here."
      />
    );
  return (
    <View style={styles.container}>
      <AppText variant="caption" color={theme.COLORS.contentSecondary}>
        Tap the eye icon to view and download a receipt. Swipe across to see all
        columns.
      </AppText>
      <AppCard variant="flat" padded={false} style={{ overflow: "hidden" }}>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator>
          <View>
            <View style={[styles.row, styles.header]}>
              <View style={styles.action}>
                <AppText variant="captionBold">View</AppText>
              </View>
              <AppText variant="captionBold" style={styles.date}>
                Date
              </AppText>
              <AppText variant="captionBold" style={styles.inst}>
                Inst
              </AppText>
              <AppText
                variant="captionBold"
                align="right"
                style={styles.number}
              >
                Rate
              </AppText>
              {hasWeight && (
                <AppText
                  variant="captionBold"
                  align="right"
                  style={styles.number}
                >
                  Weight
                </AppText>
              )}
              <AppText
                variant="captionBold"
                align="right"
                style={styles.number}
              >
                Amount
              </AppText>
            </View>
            {visible.map(({ payment: p, index }) => (
              <View
                key={`${p.receiptNo ?? "receipt"}-${index}`}
                style={styles.row}
              >
                <Pressable
                  onPress={() => onReceipt(p)}
                  accessibilityRole="button"
                  accessibilityLabel={`View receipt for installment ${p.installment ?? index + 1}`}
                  style={styles.action}
                >
                  <Ionicons
                    name="eye-outline"
                    size={20}
                    color={theme.COLORS.contentBrand}
                  />
                </Pressable>
                <AppText variant="captionBold" style={styles.date}>
                  {dateLabel(p.updateTime)}
                </AppText>
                <AppText variant="captionBold" style={styles.inst}>
                  #{p.installment ?? "—"}
                </AppText>
                <AppText variant="captionBold" align="right" style={styles.number}>
                  {toNumber(p.rate) > 0 ? money(p.rate) : "—"}
                </AppText>
                {hasWeight && (
                  <AppText
                    variant="captionBold"
                    align="right"
                    color={theme.COLORS.contentBrand}
                    style={styles.number}
                  >
                    {toNumber(p.weight).toFixed(4)} g
                  </AppText>
                )}
                <AppText
                  variant="captionBold"
                  align="right"
                  color={theme.COLORS.successText}
                  style={styles.number}
                >
                  {money(p.amount)}
                </AppText>
              </View>
            ))}
          </View>
        </ScrollView>
      </AppCard>
      {payments.length > 4 && (
        <Pressable
          style={styles.more}
          accessibilityRole="button"
          onPress={() => setExpanded((value) => !value)}
        >
          <AppText variant="bodyMedium" color={theme.COLORS.contentBrand}>
            {expanded
              ? "Show fewer receipts"
              : `Show ${payments.length - 4} earlier receipts`}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}
const baseStyles = StyleSheet.create({
  container: { gap: theme.SIZES.space.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.SIZES.space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.COLORS.divider,
    minHeight: 52,
    paddingVertical: theme.SIZES.space.sm,
    gap: theme.SIZES.space.sm,
  },
  header: { backgroundColor: theme.COLORS.surfaceMuted },
  date: { flexShrink: 0 },
  inst: { flexShrink: 0 },
  number: { flexShrink: 0 },
  action: {
    flexShrink: 0,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  more: { minHeight: 48, alignItems: "center", justifyContent: "center" },
});
