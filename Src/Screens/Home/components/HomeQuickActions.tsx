import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../Components/ui/appcomponents';
import { COLORS, SIZES } from '../../../Utills/AppTheme';

const ACTIONS = [
  { label: 'My Schemes', detail: 'Your savings', icon: 'safe-square-outline', route: 'AllSchemes' },
  { label: 'Wastage Card', detail: 'Your benefits', icon: 'card-account-details-outline', route: 'WastageCard' },
  { label: 'Support', detail: 'Here for you', icon: 'headset', route: 'HelpCenter' },
] as const;

export default function HomeQuickActions({ onNavigate }: { onNavigate: (route: string) => void }) {
  return (
    <View style={styles.row}>
      {ACTIONS.map((action) => (
        <Pressable key={action.route} onPress={() => onNavigate(action.route)} accessibilityRole="button" style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <View style={styles.icon}><MaterialCommunityIcons name={action.icon} size={23} color={COLORS.brand} /></View>
          <AppText variant="captionBold" color={COLORS.contentPrimary} align="center" style={styles.label}>{action.label}</AppText>
          <AppText variant="caption" color={COLORS.contentMuted} align="center" style={styles.detail}>{action.detail}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SIZES.space.sm, marginHorizontal: SIZES.space.gutter, marginTop: SIZES.space.xl },
  action: { flex: 1, alignItems: 'center', paddingVertical: SIZES.space.md, paddingHorizontal: 4, borderRadius: SIZES.radius.lg, borderWidth: 1, borderColor: COLORS.accentSoft, backgroundColor: COLORS.whiteAlpha90 },
  pressed: { backgroundColor: COLORS.accentSoft },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.accentTint, alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.space.sm },
  label: { fontSize: 10, lineHeight: 16 },
  detail: { fontSize: 8, lineHeight: 13, marginTop: 2 },
});
