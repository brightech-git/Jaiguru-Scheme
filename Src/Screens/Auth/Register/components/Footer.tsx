import { Text } from '../../../../Components/Typography/FontText';
// Src/Screens/Auth/Register/components/Footer.tsx
// -----------------------------------------------------------------------------
// Bottom section: "Already have an account? Login".
// -----------------------------------------------------------------------------

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import theme from '../../../../Utills/AppTheme';

const { COLORS, SIZES, FONTS, STYLES } = theme;

export interface FooterProps {
  onLogin: () => void;
  disabled?: boolean;
}

const Footer: React.FC<FooterProps> = ({ onLogin, disabled }) => (
  <View style={[STYLES.rowCenter, styles.wrap]}>
    <Text style={styles.text}>Already have an account? </Text>
    <Pressable onPress={onLogin} disabled={disabled} hitSlop={6} accessibilityRole="button">
      <Text style={styles.link}>Login</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginTop: SIZES.space.xxl,
  },
  text: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.md,
    color: COLORS.contentSecondary,
  },
  link: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.md,
    color: COLORS.contentBrand,
  },
});

export default React.memo(Footer);
