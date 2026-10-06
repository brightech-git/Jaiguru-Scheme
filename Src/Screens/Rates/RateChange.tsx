import React from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../Components/ui/appcomponents';
import theme from '../../Utills/AppTheme';

export const money = (value: number) => `₹ ${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function RateChange({ change, percent }: { change: number | null; percent?: number | null }) {
  const color = change === null || change === 0 ? theme.COLORS.contentMuted : change > 0 ? theme.COLORS.successText : theme.COLORS.dangerText;
  return (
    <View style={styles.row}>
      {change !== null && <Ionicons name={change === 0 ? 'remove' : change > 0 ? 'trending-up' : 'trending-down'} size={16} color={color} />}
      <AppText variant="captionBold" color={color}>
        {change === null ? '—' : `${change > 0 ? '+' : change < 0 ? '−' : ''}${money(Math.abs(change))}${percent != null ? ` (${Math.abs(percent).toFixed(2)}%)` : ''}`}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: theme.SIZES.space.xs } });


