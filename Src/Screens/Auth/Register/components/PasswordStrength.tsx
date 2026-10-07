import { Text } from '../../../../Components/Typography/FontText';
// Src/Screens/Auth/Register/components/PasswordStrength.tsx
// -----------------------------------------------------------------------------
// Live password strength meter: an animated gold/traffic-light bar plus the
// five requirement rows that tick green as they're satisfied.
// -----------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import theme from '../../../../Utills/AppTheme';
import { PASSWORD_RULES, passwordScore } from '../validation/registerSchema';

const { COLORS, SIZES, FONTS } = theme;

export interface PasswordStrengthProps {
  password: string;
}

const strengthMeta = (score: number): { label: string; color: string } => {
  if (score <= 2) return { label: 'Weak', color: COLORS.danger };
  if (score <= 4) return { label: 'Good', color: COLORS.warning };
  return { label: 'Strong', color: COLORS.success };
};

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const score = passwordScore(password);
  const { label, color } = strengthMeta(score);

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(score / PASSWORD_RULES.length, { duration: 300 });
  }, [score, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    backgroundColor: color,
  }));

  if (!password) return null;

  return (
    <View style={styles.wrap} accessibilityLabel={`Password strength: ${label}`}>
      <View style={styles.barRow}>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, barStyle]} />
        </View>
        <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
      </View>

      <View style={styles.rules}>
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <View key={rule.key} style={styles.ruleRow}>
              <MaterialCommunityIcons
                name={ok ? 'check-circle' : 'circle-outline'}
                size={SIZES.icon.sm}
                color={ok ? COLORS.success : COLORS.contentMuted}
              />
              <Text style={[styles.ruleText, ok && styles.ruleTextOk]}>{rule.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: SIZES.space.xs,
    marginBottom: SIZES.space.lg,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.accentSubtle,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: SIZES.radius.pill,
  },
  strengthLabel: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.xxs,
    marginLeft: SIZES.space.sm,
    minWidth: 44,
    textAlign: 'right',
  },
  rules: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.space.sm,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingVertical: SIZES.space.xs / 2,
  },
  ruleText: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.xxs,
    color: COLORS.contentMuted,
    marginLeft: SIZES.space.xs,
  },
  ruleTextOk: {
    color: COLORS.contentPrimary,
    fontFamily: FONTS.family.medium,
  },
});

export default React.memo(PasswordStrength);
