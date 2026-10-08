import { StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS, ELEVATION, moderateScale } from '../../Utills/AppTheme';

export default StyleSheet.create({
  host: {
    backgroundColor: 'transparent',
    paddingTop: SIZES.space.sm,
    flexShrink: 0,
  },
  shadowWrap: {
    marginHorizontal: SIZES.space.xs,
    borderRadius: SIZES.radius.pill,
    ...ELEVATION.floating,
  },
  capsule: {
    borderWidth: 1,
    borderColor: COLORS.brandSoft,
    backgroundColor: COLORS.brand,
    borderRadius: SIZES.radius.pill,
    overflow: 'hidden',
  },
  gradient: { ...StyleSheet.absoluteFillObject },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  footerBtnContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 2,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    height: moderateScale(28),
  },
  activePill: {
    position: 'absolute',
    width: moderateScale(40),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: COLORS.accentTint,
  },
  label: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.2,
    textAlign: 'center',
    lineHeight: 14,
    width: '100%',
  },
  labelSlot: { width: '100%', justifyContent: 'center' },
  activeText: { color: COLORS.accentTint, fontFamily: FONTS.family.semiBold },
  inactiveText: { color: COLORS.whiteAlpha80, fontFamily: FONTS.family.regular },
  tabBadge: {
    position: 'absolute',
    top: -3,
    right: -10,
    minWidth: 15,
    height: 15,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.accentDeep,
    borderColor: COLORS.brand,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    fontSize: 8,
    color: COLORS.contentPrimary,
    fontFamily: FONTS.family.bold,
  },
});
