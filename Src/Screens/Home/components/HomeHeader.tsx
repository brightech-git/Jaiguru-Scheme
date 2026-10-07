import { Text } from '../../../Components/Typography/FontText';
// Src/Screens/Home/components/HomeHeader.tsx
// -----------------------------------------------------------------------------
// Premium Home header: curved gold gradient with floating particles + shimmer,
// greeting + avatar + notifications + quick actions, and floating summary cards
// (gold rate · scheme · wallet). Dummy-data by default; every prop is typed so
// it can be wired to the backend later.
// -----------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { Dimensions, Image, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

const HEADER_GRADIENT: [string, string, string] = [COLORS.brandDeep, COLORS.brandStrong, COLORS.brand];
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
  const { company } = useCompany();

  // Slow shimmer sweep across the curved header.
  const shine = useSharedValue(0);
  useEffect(() => {
    shine.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [shine]);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shine.value, [0, 1], [-width, width]) }, { rotateZ: '18deg' }],
    opacity: interpolate(shine.value, [0, 0.5, 1], [0, 0.16, 0]),
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
          <View style={styles.orbitOuter} />
          <View style={styles.orbitInner} />
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
            <View style={{ flex: 1 }}>
              <Text style={styles.brandEyebrow}>THE ART OF FINE JEWELLERY</Text>
              <Text style={styles.companyName} numberOfLines={2}>
                {company?.COMPANYNAME || company?.COMPANYID || 'Jaiguru Jewellers'}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={onNotificationsPress} style={styles.notificationButton} accessibilityRole="button" accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}>
              <MaterialCommunityIcons name="bell-outline" size={20} color={COLORS.accentTint} />
              {unreadCount > 0 && <View style={styles.notificationDot} />}
            </Pressable>
            <ProfileAvatar size={42} name={profile.name} imageUrl={profile.avatarUrl} onPress={onProfilePress} />
          </View>
        </View>

        {/* Greeting below */}
        <GreetingSection greeting={getGreeting()} name={profile.name} />
        {/* <View style={styles.signatureLine}><View style={styles.goldLine} /><Text style={styles.signature}>A little today. A golden tomorrow.</Text></View> */}
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
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
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
    marginBottom: SIZES.space.xxl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SIZES.space.md,
  },
  logo: {
    width: theme.moderateScale(44),
    height: theme.moderateScale(44),
    borderRadius: theme.moderateScale(22),
    marginRight: SIZES.space.sm,
  },
  companyName: {
    fontFamily: theme.FONTS.family.semiBold,
    fontSize: 13,
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
  brandEyebrow: { fontFamily: theme.FONTS.family.medium, fontSize: 7, lineHeight: 12, letterSpacing: 1, color: COLORS.accentStrong },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.sm },
  notificationButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: COLORS.whiteAlpha20, backgroundColor: COLORS.whiteAlpha10, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', top: 8, right: 9, width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accentDeep },
  orbitOuter: { position: 'absolute', right: -110, top: 65, width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: COLORS.accentAlpha16 },
  orbitInner: { position: 'absolute', right: -85, top: 90, width: 230, height: 230, borderRadius: 115, borderWidth: 1, borderColor: COLORS.accentAlpha08 },
  signatureLine: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.sm, marginTop: SIZES.space.lg },
  goldLine: { width: 22, height: 1, backgroundColor: COLORS.accentDeep },
  signature: { fontFamily: theme.FONTS.family.regular, fontSize: 10, color: COLORS.accentSoft, letterSpacing: 0.3 },
});

export default React.memo(HomeHeader);
