import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import Header from "../../Components/CommonHeader/CommonHeader";
import {
  AppCard,
  AppEmptyState,
  AppSectionHeader,
  AppText,
  ScreenWrapper,
} from "../../Components/ui/appcomponents";
import theme from "../../Utills/AppTheme";
import { ratesService } from "../../api/services/ratesService";
import { Metal, RateHistoryEntry, Rates } from "../../types/Rates/Rates";
import RateTrendChart from "./RateTrendChart";
import RateHistoryTable from "./RateHistoryTable";
import RateChange, { formatDate, money } from "./RateChange";

const { COLORS, SIZES } = theme;
type MetalId = Metal | "G" | "S";
type RatesRoute = RouteProp<
  { Rates: { metal?: MetalId } | undefined },
  "Rates"
>;

const resolveMetal = (m?: MetalId): Metal => {
  if (m === "G") return "Gold";
  if (m === "S") return "Silver";
  return m === "Silver" ? "Silver" : "Gold";
};

export default function RatesScreen() {
  const route = useRoute<RatesRoute>();
  const [metal, setMetal] = useState<Metal>(resolveMetal(route.params?.metal));
  useEffect(() => {
    setMetal(resolveMetal(route.params?.metal));
  }, [route.params?.metal]);
  const [today, setToday] = useState<Rates | null>(null);
  const [histories, setHistories] = useState<Record<Metal, RateHistoryEntry[] | null>>({ Gold: null, Silver: null });
  const [loading, setLoading] = useState(true);
  const [todayError, setTodayError] = useState<string | null>(null);
  const [historyErrors, setHistoryErrors] = useState<Record<Metal, string | null>>({ Gold: null, Silver: null });
  const mounted = useRef(false);
  const pending = useRef(false);

  const load = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    const [current, gold, silver] = await Promise.allSettled([
      ratesService.getTodayRate(),
      ratesService.getHistory('G'),
      ratesService.getHistory('S'),
    ]);
    pending.current = false;
    if (!mounted.current) return;
    if (current.status === "fulfilled") {
      setToday(current.value);
      setTodayError(null);
    } else
      setTodayError(current.reason?.message || "Unable to load current rates.");
    setHistories(previous => ({
      Gold: gold.status === 'fulfilled' ? gold.value : previous.Gold,
      Silver: silver.status === 'fulfilled' ? silver.value : previous.Silver,
    }));
    setHistoryErrors({
      Gold: gold.status === 'rejected' ? gold.reason?.message || 'Unable to load gold history.' : null,
      Silver: silver.status === 'rejected' ? silver.reason?.message || 'Unable to load silver history.' : null,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const history = histories[metal];
  const historyError = historyErrors[metal];
  const entries = history;
  const latest = entries?.[entries.length - 1];
  const rate = today
    ? Number(metal === "Gold" ? today.GOLDRATE : today.SILVERRATE)
    : null;
  const currentRate =
    rate !== null && Number.isFinite(rate) && rate > 0 ? rate : null;
  const empty = !entries?.length;

  return (
    <ScreenWrapper
      scroll
      edges={["bottom"]}
      paddingTop={SIZES.space.lg}
      refreshing={loading}
      onRefresh={load}
      header={
        <Header
          title="Metal rates"
          // subtitle="Gold & silver · per gram"
          rightIconName="refresh"
          onRightPress={load}
        />
      }
    >
      <AppCard variant="blueLight" style={styles.hero}>
        <View style={styles.tabs}>
          {(["Gold", "Silver"] as Metal[]).map((item) => (
            <Pressable
              key={item}
              accessibilityRole="tab"
              accessibilityState={{ selected: item === metal }}
              onPress={() => setMetal(item)}
              style={[styles.tab, item === metal && styles.selected]}
            >
              <AppText
                variant="bodyBold"
                color={
                  item === metal ? COLORS.contentBrand : COLORS.contentSecondary
                }
              >
                {item}
                {item === "Gold" ? " 22K" : ""}
              </AppText>
            </Pressable>
          ))}
        </View>
        <AppText variant="labelUppercase" color={COLORS.contentBrand}>
          {metal} · per gram
        </AppText>
        {loading && currentRate === null ? (
          <ActivityIndicator color={COLORS.brand} />
        ) : (
          <AppText variant="h1" color={COLORS.contentBrand}>
            {currentRate === null ? "Unavailable" : money(currentRate)}
          </AppText>
        )}
        <AppText variant="captionBold">Current rate</AppText>
        {todayError && (
          <AppText variant="caption" color={COLORS.dangerText}>
            {todayError}
            {today ? " Showing previously loaded rates." : ""}
          </AppText>
        )}
        {latest && (
          <View style={styles.summary}>
            <RateChange change={latest.change} percent={latest.changePct} />
            <AppText variant="captionBold">
              Latest history change · {formatDate(latest.date)}
            </AppText>
          </View>
        )}
      </AppCard>
      <AppSectionHeader title="Recent trend" style={styles.section} />
      <>
          {historyError && (
            <AppEmptyState
              icon="cloud-offline-outline"
              title="History could not refresh"
              message={historyError}
              actionLabel="Retry"
              onAction={load}
            />
          )}
          {loading && history === null ? (
            <ActivityIndicator color={COLORS.brand} style={styles.section} />
          ) : empty ? (
            !historyError && (
              <AppEmptyState
                title="No rate history yet"
                message="Pull down to refresh the latest rates."
              />
            )
          ) : (
            <>
              <AppText variant="caption" style={styles.caption}>
                {entries!.length} sessions · change versus previous available
                session
              </AppText>
              <RateTrendChart history={entries!} />
              <AppSectionHeader
                title="Daily rate history"
                style={styles.section}
              />
              <RateHistoryTable history={entries!} />
            </>
          )}
      </>
      <AppText
        variant="caption"
        color={COLORS.contentMuted}
        style={styles.section}
      >
        Rates are indicative and may vary from transaction prices at the time of
        billing.
      </AppText>
    </ScreenWrapper>
  );
}
const styles = StyleSheet.create({
  hero: { gap: SIZES.space.sm },
  tabs: {
    flexDirection: "row",
    marginBottom: SIZES.space.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SIZES.space.md,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.transparent,
  },
  selected: { borderBottomColor: COLORS.brand },
  summary: { gap: SIZES.space.xs, marginTop: SIZES.space.sm },
  section: { marginTop: SIZES.space.xxl },
  caption: { marginBottom: SIZES.space.md },
});
