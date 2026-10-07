import { Text } from '../../../../Components/Typography/FontText';
// Src/Screens/Auth/Login/components/Footer.tsx
// -----------------------------------------------------------------------------
// Trust footer: security badges (Secure Login · 256-bit Encryption · Trusted
// Since) and legal links (Privacy Policy · Terms & Conditions). Uses AppTheme.
// -----------------------------------------------------------------------------

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import theme from '../../../../Utills/AppTheme';

const { COLORS, SIZES, FONTS } = theme;
type MCName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface FooterProps {
  trustedSince?: string;
  onPrivacy?: () => void;
  onTerms?: () => void;
}

const BADGES: readonly { icon: MCName; label: string }[] = [
  { icon: 'shield-lock', label: 'Secure Login' },
  { icon: 'lock-check', label: '256-bit Encryption' },
];

const Footer: React.FC<FooterProps> = ({ trustedSince = '1985', onPrivacy, onTerms }) => (
  <View style={styles.wrap}>
    <View style={styles.badgeRow}>
      {BADGES.map((b, i) => (
        <React.Fragment key={b.label}>
          {i > 0 && <View style={styles.dot} />}
          <View style={styles.badge}>
            <MaterialCommunityIcons name={b.icon} size={SIZES.icon.xs} color={COLORS.contentBrand} />
            <Text style={styles.badgeText}>{b.label}</Text>
          </View>
        </React.Fragment>
      ))}
      <View style={styles.dot} />
      <View style={styles.badge}>
        <MaterialCommunityIcons name="diamond-stone" size={SIZES.icon.xs} color={COLORS.contentBrand} />
        <Text style={styles.badgeText}>Trusted Since {trustedSince}</Text>
      </View>
    </View>

    <View style={styles.legalRow}>
      <Pressable onPress={onPrivacy} hitSlop={6} accessibilityRole="link">
        <Text style={styles.legalLink}>Privacy Policy</Text>
      </Pressable>
      <Text style={styles.legalSep}>·</Text>
      <Pressable onPress={onTerms} hitSlop={6} accessibilityRole="link">
        <Text style={styles.legalLink}>Terms &amp; Conditions</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: SIZES.space.xxl,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: FONTS.family.medium,
    fontSize: SIZES.text.xxs,
    color: COLORS.contentSecondary,
    marginLeft: SIZES.space.xs,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.accentSubtle,
    marginHorizontal: SIZES.space.sm,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.space.lg,
  },
  legalLink: {
    fontFamily: FONTS.family.medium,
    fontSize: SIZES.text.sm,
    color: COLORS.contentBrand,
  },
  legalSep: {
    color: COLORS.contentSecondary,
    marginHorizontal: SIZES.space.sm,
  },
});

export default React.memo(Footer);
