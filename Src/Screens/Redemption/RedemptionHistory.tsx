import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CommonHeader from "../../Components/CommonHeader/CommonHeader";
import PremiumBackground from "../../Components/PremiumBackground/PremiumBackground";
import { AppText } from "../../Components/ui/appcomponents";
import { useMySchemes } from "../../api/hooks/Account/useMySchemes";
import { redemptionService } from "../../api/services/redemptionService";
import type { Account } from "../../types/Account/Account";
import { COLORS, SIZES, ELEVATION } from "../../Utills/AppTheme";

interface HistoryItem {
  account: Account;
  slipNo: number;
}
export default function RedemptionHistory() {
  const navigation = useNavigation<any>();
  const { accounts, loading, error, refetch } = useMySchemes();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState(false);
  const [retry, setRetry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setChecking(true);
      setItems([]);
      setCheckError(false);
      if (!loading && !error) {
        void Promise.allSettled(
          accounts.map(async (account) => {
            const estimates = await redemptionService.getEstimates({
              groupCode: account.groupCode,
              regNo: account.regNo,
            });
            if (!Array.isArray(estimates))
              throw new Error("Invalid estimate response");
            const slips = estimates.filter(
              (item) =>
                item.GROUPCODE === account.groupCode &&
                Number(item.RegNo) === Number(account.regNo) &&
                Number.isInteger(Number(item.SlipNo)) &&
                Number(item.SlipNo) > 0,
            );
            return slips.length
              ? {
                  account,
                  slipNo: Math.max(...slips.map((item) => Number(item.SlipNo))),
                }
              : null;
          }),
        ).then((results) => {
          if (!active) return;
          const redeemed: HistoryItem[] = [];
          let failed = false;
          results.forEach((result) => {
            if (result.status === "rejected") failed = true;
            else if (result.value) redeemed.push(result.value);
          });
          setItems(redeemed.sort((a, b) => b.slipNo - a.slipNo));
          setCheckError(failed);
          setChecking(false);
        });
      } else if (error) setChecking(false);
      return () => {
        active = false;
      };
    }, [accounts, loading, error, retry]),
  );
  const reload = () => {
    setRetry((value) => value + 1);
    void refetch();
  };

  return (
    <View style={styles.root}>
      <PremiumBackground />
      <CommonHeader
        title="History"
        showBack
        transparent
        borderBottom={false}
        shadow={false}
      />
      <SafeAreaView edges={["bottom"]} style={styles.flex}>
        <FlatList
          data={items}
          keyExtractor={(item) =>
            `${item.account.groupCode}-${item.account.regNo}`
          }
          contentContainerStyle={styles.content}
          refreshing={loading || checking}
          onRefresh={reload}
          ListHeaderComponent={
            <View style={styles.header}>
              <AppText variant="h4" color={COLORS.brand}>
                Redeemed Schemes
              </AppText>
              <AppText variant="bodyBold" color={COLORS.contentSecondary}>
                Your redeemed savings and store slip numbers.
              </AppText>
              {(!!error || checkError) && (
                <Pressable
                  accessibilityRole="button"
                  onPress={reload}
                  style={styles.retry}
                >
                  <AppText color={COLORS.dangerText}>
                    {error || "Some redemption records could not be loaded."}{" "}
                    Tap to retry.
                  </AppText>
                </Pressable>
              )}
            </View>
          }
          ListEmptyComponent={
            loading || checking ? (
              <ActivityIndicator color={COLORS.brand} style={styles.empty} />
            ) : !error && !checkError ? (
              <View style={styles.empty}>
                <AppText variant="bodyMedium" align="center">
                  No redeemed schemes yet
                </AppText>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate("SchemePassbook", {
                  schemeData: item.account,
                  fromScreen: "RedemptionHistory",
                })
              }
              style={({ pressed }) => [
                styles.card,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.glass}>
                <BlurView
                  tint="light"
                  intensity={35}
                  pointerEvents="none"
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  pointerEvents="none"
                  colors={[
                    COLORS.whiteAlpha80,
                    COLORS.whiteAlpha20,
                    COLORS.accentAlpha32,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View pointerEvents="none" style={styles.glow} />
                <View style={styles.cardContent}>
                  <View style={styles.row}>
                    <View style={styles.identity}>
                      <View style={styles.icon}>
                        <MaterialCommunityIcons
                          name="diamond-stone"
                          size={25}
                          color={COLORS.brand}
                        />
                      </View>
                      <AppText variant="captionBold" color={COLORS.brand}>
                        {item.account.groupCode}-{item.account.regNo}
                      </AppText>
                    </View>
                    <View style={styles.badge}>
                      <AppText variant="captionBold" color={COLORS.dangerText}>
                        Redeemed
                      </AppText>
                    </View>
                  </View>
                  <AppText
                    variant="captionBold"
                    color={COLORS.brand}
                    style={styles.name}
                  >
                    {item.account.schemeSummary?.schemeName || "Savings scheme"}
                  </AppText>
                  <AppText variant="bodyBold">
                    {item.account.pName || "Member"}
                  </AppText>
                  <View style={styles.slip}>
                    <View style={styles.slipLabel}>
                      <MaterialCommunityIcons
                        name="receipt-text-outline"
                        size={20}
                        color={COLORS.brand}
                      />
                      <AppText
                        variant="h6"
                        color={COLORS.contentSecondary}
                      >
                        Closing Slip No
                      </AppText>
                    </View>
                    <AppText variant="h4" color={COLORS.brand}>
                      {item.slipNo}
                    </AppText>
                  </View>
                  <View style={styles.cardFooter}>
                    <AppText variant="captionBold" color={COLORS.brand}>
                      View passbook
                    </AppText>
                    <View style={styles.arrow}>
                      <MaterialCommunityIcons
                        name="arrow-right"
                        size={18}
                        color={COLORS.contentOnBrand}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.accentTint },
  flex: { flex: 1 },
  content: { padding: SIZES.space.lg, flexGrow: 1 },
  header: { gap: SIZES.space.sm, marginBottom: SIZES.space.lg },
  card: {
    borderRadius: SIZES.radius.card,
    marginBottom: SIZES.space.lg,
    ...ELEVATION.raised,
  },
  glass: {
    borderRadius: SIZES.radius.card,
    overflow: "hidden",
    backgroundColor: COLORS.whiteAlpha50,
    borderWidth: 1,
    borderColor: COLORS.whiteAlpha90,
  },
  cardContent: { padding: SIZES.space.lg },
  glow: {
    position: "absolute",
    right: -45,
    top: -65,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: COLORS.accentAlpha32,
  },
  identity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.space.sm,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.brandAlpha08,
    alignItems: "center",
    justifyContent: "center",
  },
  slip: {
    marginTop: SIZES.space.lg,
    padding: SIZES.space.md,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.whiteAlpha50,
    borderWidth: 1,
    borderColor: COLORS.accentAlpha32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SIZES.space.sm,
  },
  slipLabel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.space.sm,
  },
  cardFooter: {
    marginTop: SIZES.space.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SIZES.space.sm,
  },
  badge: {
    backgroundColor: COLORS.dangerSurface,
    paddingHorizontal: SIZES.space.sm,
    paddingVertical: SIZES.space.xs,
    borderRadius: SIZES.radius.sm,
  },
  name: { marginTop: SIZES.space.sm },
  empty: { paddingVertical: SIZES.space.xl },
  retry: { paddingVertical: SIZES.space.sm },
});
