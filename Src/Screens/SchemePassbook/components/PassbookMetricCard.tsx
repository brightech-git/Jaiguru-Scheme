import React from "react";
import { View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppCard, AppText } from "../../../Components/ui/appcomponents";
import theme from "../../../Utills/AppTheme";
export default function PassbookMetricCard({
  label,
  value,
  caption,
  icon,
}: {
  label: string;
  value: string;
  caption: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <AppCard variant="flat" style={styles.card}>
      <Ionicons name={icon} size={22} color={theme.COLORS.contentBrand} />
      <AppText variant="captionBold" color={theme.COLORS.contentSecondary}>
        {label}
      </AppText>
      <AppText variant="h3" color={theme.COLORS.contentBrand}>
        {value}
      </AppText>
      <AppText variant="captionBold">{caption}</AppText>
    </AppCard>
  );
}
const styles = StyleSheet.create({
  card: { flex: 1, gap: theme.SIZES.space.sm },
});
