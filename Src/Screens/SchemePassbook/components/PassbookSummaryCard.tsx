import React from "react";
import { View, StyleSheet } from "react-native";
import { AppCard, AppText } from "../../../Components/ui/appcomponents";
import theme from "../../../Utills/AppTheme";
export interface PassbookSummaryRow {
  label: string;
  value?: string;
  highlight?: boolean;
}
export default function PassbookSummaryCard({
  rows,
}: {
  rows: PassbookSummaryRow[];
}) {
  const visibleRows = rows.filter((row) => {
    const value = row.value?.trim();
    return !!value && !["—", "-", "n/a", "null", "undefined"].includes(value.toLowerCase());
  });

  if (visibleRows.length === 0) return null;

  return (
    <AppCard variant="flat" padded={false}>
      {visibleRows
        .map((row, index) => (
          <View
            key={row.label}
            style={[styles.row, index > 0 && styles.border]}
          >
            {row.label && (
            <AppText
              variant="captionBold"
              color={theme.COLORS.contentSecondary}
              style={styles.label}
            >
              {row.label}
            </AppText>)}
            {row.value && (
            <AppText
              variant="bodyBold"
              color={
                row.highlight
                  ? theme.COLORS.contentBrand
                  : theme.COLORS.contentPrimary
              }
              style={styles.value}
            >
              {row.value}
            </AppText>
            )}
          </View>
        ))}
    </AppCard>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: theme.SIZES.space.md,
    padding: theme.SIZES.space.md,
  },
  border: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.COLORS.divider,
  },
  label: { flex: 1 },
  value: { flex: 1.5, textAlign: "right" },
});
