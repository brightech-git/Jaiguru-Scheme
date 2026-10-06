// Src/Screens/Home/components/HomeHeader.tsx
// -----------------------------------------------------------------------------
// Premium Home header: curved gold gradient with floating particles + shimmer,
// greeting + avatar + notifications + quick actions, and floating summary cards
// (gold rate · scheme · wallet). Dummy-data by default; every prop is typed so
// it can be wired to the backend later.
// -----------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import theme from '../../../Utills/AppTheme';
import GoldParticles from '../../Auth/Login/components/GoldParticles';
import GreetingSection from './GreetingSection';
import ProfileAvatar from './ProfileAvatar';
import GoldRateCard from './GoldRateCard';
import { navigate as navigateRoot } from '../../../Navigations/navigationRef';
import { useCompany } from '../../../api/hooks/Company/useCompany';
const LOCAL_LOGO = require('../../../../assets/icon.png');

import {
  getGreeting,
  type CustomerProfile,
  type SchemeSummary,
  type WalletStat,
} from './homeHeaderData';

const { COLORS, SIZES } = theme;
const { width } = Dimensions.get('window');

const HEADER_GRADIENT = COLORS.gradient.brand as [string, string, string];
const SHINE_GRADIENT = COLORS.gradient.shine as [string, string, string];
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export interface HomeHeaderProps {
  profile: CustomerProfile;
  goldValue?: number | null;
  silverValue?: number | null;
  ratesLoading?: boolean;
  ratesError?: string | null;
  ratesUpdatedAt?: string;
  scheme?: SchemeSummary;
  wallet?: readonly WalletStat[];
  unreadCount?: number;
  refreshingRate?: boolean;
  onProfilePress?: () => void;
  onNotificationsPress?: () => void;
  onScanPress?: () => void;
  onSupportPress?: () => void;
  onSettingsPress?: () => void;
  onRefreshRate?: () => void | Promise<void>;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  profile,
  goldValue = null,
  silverValue = null,
  ratesLoading = false,
  ratesError = null,
  ratesUpdatedAt,
  unreadCount = 3,
  refreshingRate = false,
  onProfilePress,
  onNotificationsPress,
  onRefreshRate,
}) => {
  const insets = useSafeAreaInsets();
  const { company, loading: companyLoading } = useCompany();

  // Slow shimmer sweep across the curved header.
  const shine = useSharedValue(0);
  useEffect(() => {
    shine.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [shine]);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shine.value, [0, 1], [-width, width]) }, { rotateZ: '18deg' }],
    opacity: interpolate(shine.value, [0, 0.5, 1], [0, 0.5, 0]),
  }));

  return (
    <View style={styles.wrap}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Curved gold header */}
      <LinearGradient
        colors={HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.curve, { paddingTop: insets.top + SIZES.space.sm }]}
      >
        {/* particles + shimmer */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <GoldParticles width={width} height={width * 0.7} />
          <View style={styles.shineClip} pointerEvents="none">
            <AnimatedGradient
              colors={SHINE_GRADIENT}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.shine, shineStyle]}
            />
          </View>
        </View>

        {/* Single row: logo + company name (left) | avatar (right) */}
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <Image source={LOCAL_LOGO} style={styles.logo} resizeMode="contain" />
            <Text style={styles.companyName} numberOfLines={1}>
              {company?.COMPANYNAME || company?.COMPANYID || 'Jaiguru Jewellers'}
            </Text>
          </View>
          <ProfileAvatar name={profile.name} imageUrl={profile.avatarUrl} onPress={onProfilePress} />
        </View>

        {/* Greeting below */}
        <GreetingSection greeting={getGreeting()} name={profile.name} />
      </LinearGradient>

      {/* Floating cards overlapping the curve */}
      <View style={styles.cards}>
        <GoldRateCard
          onGoldPress={() => navigateRoot('Rates', { metal: 'G' })}
          onSilverPress={() => navigateRoot('Rates', { metal: 'S' })}
          gold={goldValue}
          silver={silverValue}
          loading={ratesLoading}
          error={ratesError}
          lastUpdated={ratesUpdatedAt}
          onRefresh={onRefreshRate}
          refreshing={refreshingRate}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  curve: {
    borderBottomLeftRadius: SIZES.radius.xxl,
    borderBottomRightRadius: SIZES.radius.xxl,
    paddingHorizontal: SIZES.space.gutter,
    paddingBottom: SIZES.space.huge + SIZES.space.xl,
    overflow: 'hidden',
  },
  shineClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: -SIZES.space.huge,
    bottom: -SIZES.space.huge,
    width: SIZES.space.huge,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.space.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SIZES.space.md,
  },
  logo: {
    width: theme.moderateScale(66),
    height: theme.moderateScale(66),
    borderRadius: theme.moderateScale(33),
    marginRight: SIZES.space.sm,
  },
  companyName: {
    fontFamily: theme.FONTS.family.bold,
    fontSize: SIZES.text.lg,
    color: COLORS.contentOnBrand,
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  quickWrap: { marginTop: SIZES.space.lg },
  cards: {
    marginTop: -SIZES.space.huge,
    paddingHorizontal: SIZES.space.gutter,
  },
  cardGap: { marginTop: SIZES.space.lg },
});

export default React.memo(HomeHeader);
