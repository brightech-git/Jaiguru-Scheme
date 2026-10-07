import { Text } from '../../../Components/Typography/FontText';
// Src/Screens/Home/components/GoldRateCard.tsx
// -----------------------------------------------------------------------------
// Floating premium "Today's Rate" card driven by the real /account/todayrate
// data (GOLD + SILVER per gram). LIVE badge, loading/error states and an
// animated refresh button.
// -----------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import theme from '../../../Utills/AppTheme';
import { useNavigation } from '@react-navigation/native';

const { COLORS, SIZES, FONTS, ELEVATION } = theme;

export interface GoldRateCardProps {
  gold?: number | null;
  silver?: number | null;
  loading?: boolean;
  error?: string | null;
  lastUpdated?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  onGoldPress?: () => void;
  onSilverPress?: () => void;
}

const formatINR = (n: number) => `₹ ${n.toLocaleString('en-IN')}`;

const GoldRateCard: React.FC<GoldRateCardProps> = ({
  gold,
  silver,
  loading = false,
  error = null,
  lastUpdated,
  onRefresh,
  refreshing = false,
  onGoldPress,
  onSilverPress,
}) => {
  const navigation = useNavigation<any>();
  const spin = useSharedValue(0);
  const livePulse = useSharedValue(0);
  const isLive = !loading && !error && gold != null;

  useEffect(() => {
    livePulse.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [livePulse]);

  useEffect(() => {
    if (refreshing || loading) {
      spin.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.linear }), -1, false);
    } else {
      spin.value = withTiming(0, { duration: 200 });
    }
  }, [refreshing, loading, spin]);

  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const liveDotStyle = useAnimatedStyle(() => ({ opacity: 0.4 + 0.6 * livePulse.value }));

  const renderValue = (v: number | null | undefined) => {
    if (loading) return <ActivityIndicator size="small" color={COLORS.contentBrand} />;
    if (error || v == null) return <Text style={styles.na}>N/A</Text>;
    return <Text style={styles.rate}>{formatINR(v)}</Text>;
  };

  return (
    <View style={styles.shadow}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <MaterialCommunityIcons name="gold" size={SIZES.icon.md} color={COLORS.contentBrand} />
            <Text style={styles.title}>Today's Rate</Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable onPress={() => navigation.navigate('Rates')} accessibilityRole="button" accessibilityLabel="View gold and silver rate history" hitSlop={8}>
              <MaterialCommunityIcons name="chart-line" size={SIZES.icon.md} color={COLORS.contentBrand} />
            </Pressable>
            {isLive && (
              <View style={styles.liveBadge}>
                <Animated.View style={[styles.liveDot, liveDotStyle]} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            <Pressable onPress={onRefresh} hitSlop={8} accessibilityRole="button" accessibilityLabel="Refresh rates">
              <Animated.View style={spinStyle}>
                <MaterialCommunityIcons name="refresh" size={SIZES.icon.sm} color={COLORS.contentBrand} />
              </Animated.View>
            </Pressable>
          </View>
        </View>

        <View style={styles.ratesRow}>
          <Pressable style={styles.rateCol} onPress={onGoldPress} accessibilityRole="button" accessibilityLabel="View gold rate history">
            <View style={styles.metalWrap}>
              <MaterialCommunityIcons name="circle" size={SIZES.icon.xs} color={COLORS.contentBrand} />
              <Text style={styles.metal}>GOLD</Text>
            </View>
            <Text style={styles.purity}>916</Text>
            {renderValue(gold)}
            <Text style={styles.unit}>per gram</Text>
          </Pressable>

          <View style={styles.vDivider} />

          <Pressable style={styles.rateCol} onPress={onSilverPress} accessibilityRole="button" accessibilityLabel="View silver rate history">
            <View style={styles.metalWrap}>
              <MaterialCommunityIcons name="circle" size={SIZES.icon.xs} color={COLORS.contentPlaceholder} />
              <Text style={styles.metal}>SILVER</Text>
            </View>
            {renderValue(silver)}
            <Text style={styles.unit}>per gram</Text>
          </Pressable>
        </View>

         {!!lastUpdated && !error && !loading && (
          <View style={styles.footer}>
            <MaterialCommunityIcons name="clock-outline" size={SIZES.icon.xs} color={COLORS.contentMuted} />
            <Text style={styles.updated}>Updated {lastUpdated}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    borderRadius: SIZES.radius.xxl,
    ...ELEVATION.floating,
    shadowColor: COLORS.shadowAccent,
  },
  card: {
    borderRadius: SIZES.radius.xxl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.brandAlpha16,
    paddingHorizontal: SIZES.space.lg,
    paddingVertical: SIZES.space.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center' },
  title: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.md,
    color: COLORS.contentPrimary,
    marginLeft: SIZES.space.sm,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.sm },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}1A`,
    paddingHorizontal: SIZES.space.sm,
    paddingVertical: 3,
    borderRadius: SIZES.radius.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 4,
  },
  liveText: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.xxs,
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  ratesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.space.xs,
  },
  rateCol: { flex: 1, alignItems: 'center' },
  metalWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 1 },
  metal: {
    fontFamily: FONTS.family.medium,
    fontSize: SIZES.text.xxs,
    color: COLORS.contentSecondary,
    letterSpacing: 1,
    marginLeft: SIZES.space.xs,
  },
  purity: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.xxs,
    color: COLORS.contentBrand,
    letterSpacing: 1,
  },
  rate: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.md,
    color: COLORS.contentBrand,
  },
  na: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.md,
    color: COLORS.contentMuted,
  },
  unit: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.xxs,
    color: COLORS.contentSecondary,
  },
  vDivider: {
    width: 1,
    height: SIZES.icon.lg,
    backgroundColor: COLORS.borderSubtle,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.space.xs,
    paddingTop: SIZES.space.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  updated: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.xs,
    color: COLORS.contentMuted,
    marginLeft: SIZES.space.xs,
  },
});

export default React.memo(GoldRateCard);
