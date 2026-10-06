// Src/Components/MainHeader/MainHeader.tsx
import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity,ActivityIndicator, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCompany } from '../../api/hooks/Company/useCompany';
const LOCAL_LOGO = require('../../../../assets/icon.png');
import { useTodayRate } from '../../api/hooks/Rates/useTodayRate';
import useNotifications from '../../api/hooks/Notifications/useNotifications';
import { notificationEmitter } from '../NotificationBanner/NotificationBanner';
import { COLORS, SIZES, FONTS, ELEVATION, moderateScale } from '../../Utills/AppTheme';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { navigate as navigateRoot } from '../../Navigations/navigationRef';

const GOLD_HEADER_GRADIENT = COLORS.gradient.brand as [string, string, string];

export interface HomeHeaderRedesignedProps {
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  onLogoPress?: () => void;
}

const HomeHeaderRedesigned = ({ onLogoPress }: HomeHeaderRedesignedProps) => {
  const { company, loading: companyLoading, error: companyError } = useCompany();
  const { rates, loading: ratesLoading, error: ratesError } = useTodayRate();
  const navigation = useNavigation<any>();

  const { unreadCount, refreshUnreadCount } = useNotifications();

  const handleMenuPress = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Was polling the full notification list every 1 second — needlessly
  // hammering the API. Now it refreshes just the unread count on a gentle
  // interval, plus instantly whenever a push notification actually arrives
  // in the foreground (see NotificationHelper's 'unread-changed' emit).
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 60000); // every 60s as a safety-net refresh

    const handler = () => refreshUnreadCount();
    notificationEmitter.on('unread-changed', handler);

    return () => {
      clearInterval(interval);
      notificationEmitter.off('unread-changed', handler);
    };
  }, [refreshUnreadCount]);

  const updatedAt = (date?: string, time?: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || '');
    const dateText = match ? `${match[3]}-${match[2]}-${match[1]}` : date;
    return [dateText, time].filter(Boolean).join(' | ');
  };

  return (
    <LinearGradient colors={GOLD_HEADER_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />

      {/* Top Row: Menu Icon, Logo & Company Name, Notification */}
      <View style={styles.topRow}>
        {/* Right: Notification Icon */}
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('NotificationScreen')} activeOpacity={0.7}>
          <Icon name="notifications-none" size={SIZES.icon.lg} color={COLORS.contentOnBrand} />

          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        {/* Center: Logo and Company Name */}
        <TouchableOpacity style={styles.centerContainer} onPress={onLogoPress} activeOpacity={0.7}>
          <View style={styles.logoWrapper}>
            <Image source={LOCAL_LOGO} style={styles.logo} resizeMode="contain" />
            <View style={styles.companyTextContainer}>
              <Text style={styles.companyName} numberOfLines={1}>
                {company?.COMPANYNAME || company?.COMPANYID || 'Jaiguru Jewellers'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        {/* Left: Menu Icon */}
        <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress} activeOpacity={0.7}>
          <Icon name="menu" size={SIZES.icon.lg} color={COLORS.contentOnBrand} />
        </TouchableOpacity>
      </View>

      {/* Bottom Row: Gold & Silver Rates with Updated Time */}
      <View style={styles.ratesContainer}>
        {/* Gold Rate Card */}
        <TouchableOpacity style={styles.rateCard} onPress={() => navigateRoot('Rates', { metal: 'G' })} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="View gold rate history">
          <View style={styles.rateHeader}>
            <Icon name="trending-up" size={SIZES.icon.md} color={COLORS.brand} />
            <Text style={styles.rateLabel}>GOLD</Text>
          </View>
          {ratesLoading ? (
            <ActivityIndicator size="small" color={COLORS.contentBrand} />
          ) : ratesError ? (
            <Text style={styles.rateError}>N/A</Text>
          ) : (
            <Text style={styles.rateValue}>₹{rates?.GOLDRATE?.toLocaleString('en-IN') || '--'}</Text>
          )}
          <Text style={styles.rateUnit}>per gram</Text>
          {!ratesLoading && !ratesError && !!updatedAt(rates?.GOLDRATEDATE, rates?.GOLDUPTIME) && <Text style={styles.rateUpdated}>Updated {updatedAt(rates?.GOLDRATEDATE, rates?.GOLDUPTIME)}</Text>}
        </TouchableOpacity>

        {/* Vertical Divider */}
        <View style={styles.divider} />

        {/* Silver Rate Card */}
        <TouchableOpacity style={styles.rateCard} onPress={() => navigateRoot('Rates', { metal: 'S' })} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="View silver rate history">
          <View style={styles.rateHeader}>
            <Icon name="trending-up" size={SIZES.icon.md} color={COLORS.contentSecondary} />
            <Text style={styles.rateLabel}>SILVER</Text>
          </View>
          {ratesLoading ? (
            <ActivityIndicator size="small" color={COLORS.borderStrong} />
          ) : ratesError ? (
            <Text style={styles.rateError}>N/A</Text>
          ) : (
            <Text style={[styles.rateValue, styles.silverValue]}>₹{rates?.SILVERRATE?.toLocaleString('en-IN') || '--'}</Text>
          )}
          <Text style={styles.rateUnit}>per gram</Text>
          {!ratesLoading && !ratesError && !!updatedAt(rates?.SILVERRATEDATE, rates?.SILVERUPTIME) && <Text style={styles.rateUpdated}>Updated {updatedAt(rates?.SILVERRATEDATE, rates?.SILVERUPTIME)}</Text>}
        </TouchableOpacity>
      </View>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  rateUpdated: { ...FONTS.caption, fontSize: SIZES.text.xxs, color: COLORS.contentSecondary, textAlign: 'center', marginTop: SIZES.space.xs },
  container: {
    paddingTop: (StatusBar.currentHeight || SIZES.space.md) + SIZES.space.sm,
    paddingBottom: SIZES.space.lg,
    borderBottomLeftRadius: SIZES.radius.xxl,
    borderBottomRightRadius: SIZES.radius.xxl,
    ...ELEVATION.brandGlow,
    shadowColor: COLORS.shadowBrand,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.space.lg,
    marginBottom: SIZES.space.xs,
  },
  iconButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: 22,
    backgroundColor: COLORS.whiteAlpha50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    marginHorizontal: SIZES.space.md,
    alignItems: 'center',
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.whiteAlpha70,
    borderWidth: 2,
    borderColor: COLORS.whiteAlpha80,
  },
  defaultLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyTextContainer: {
    marginLeft: SIZES.space.sm,
    flex: 1,
    alignItems: 'flex-start',
  },
  companyName: {
    ...FONTS.subheading,
    color: COLORS.contentOnBrand,
    marginBottom: moderateScale(2),
  },
  companyAddress: {
    ...FONTS.caption,
    color: COLORS.whiteAlpha70,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...FONTS.bodySm,
    color: COLORS.danger,
    marginLeft: SIZES.space.xs,
  },
  notificationBadge: {
    position: 'absolute',
    top: moderateScale(-4),
    right: moderateScale(-4),
    backgroundColor: COLORS.danger,
    borderRadius: SIZES.radius.pill,
    width: moderateScale(18),
    height: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.accentSoft,
  },
  badgeText: {
    ...FONTS.caption,
    fontSize: SIZES.text.xxs,
    color: COLORS.contentOnBrand,
    fontWeight: FONTS.weight.bold,
  },
  ratesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SIZES.space.lg,
    backgroundColor: COLORS.whiteAlpha90,
    borderRadius: SIZES.radius.lg,
    paddingVertical: SIZES.space.md,
    paddingHorizontal: SIZES.space.lg,
    borderWidth: 1,
    borderColor: COLORS.whiteAlpha80,
  },
  rateCard: {
    flex: 1,
    alignItems: 'center',
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.space.xs,
  },
  rateLabel: {
    ...FONTS.caption,
    color: COLORS.contentSecondary,
    fontWeight: FONTS.weight.semiBold,
    marginLeft: SIZES.space.xs,
    letterSpacing: 1,
  },
  rateValue: {
    ...FONTS.heading,
    color: COLORS.brand,
    fontWeight: FONTS.weight.bold,
    marginTop: moderateScale(2),
  },
  silverValue: {
    color: COLORS.contentSecondary,
  },
  rateUnit: {
    ...FONTS.caption,
    fontSize: SIZES.text.xxs,
    color: COLORS.contentMuted,
    marginTop: moderateScale(2),
  },
  rateError: {
    ...FONTS.bodySm,
    color: COLORS.danger,
    fontStyle: 'italic',
  },
  divider: {
    width: 1,
    height: moderateScale(50),
    backgroundColor: COLORS.accentSubtle,
    marginHorizontal: SIZES.space.md,
  },
  updateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.space.xs,
    paddingHorizontal: SIZES.space.lg,
  },
  updateTimeText: {
    ...FONTS.caption,
    fontSize: SIZES.text.xxs,
    color: COLORS.contentOnAccent,
    marginLeft: SIZES.space.xs,
  },
});

export default HomeHeaderRedesigned;
