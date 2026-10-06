import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppCard, AppText } from '../../Components/ui/appcomponents';
import { RateHistoryEntry } from '../../types/Rates/Rates';
import theme from '../../Utills/AppTheme';
import RateChange, { formatDate, money } from './RateChange';

export default function RateHistoryTable({ history }: { history: RateHistoryEntry[] }) {
  return (
    <AppCard variant="flat" padded={false}>
      <View style={styles.row}>
        <AppText variant="captionBold" style={styles.date}>Date</AppText>
        <AppText variant="captionBold" align="right" style={styles.rate}>Rate / g</AppText>
        <AppText variant="captionBold" align="right" style={styles.change}>Change</AppText>
      </View>
      {[...history].reverse().map(entry => (
        <View key={entry.date} style={styles.row}>
          <AppText variant="caption" style={styles.date}>{formatDate(entry.date)}</AppText>
          <AppText variant="captionBold" align="right" style={styles.rate}>{money(entry.rate)}</AppText>
          <View style={[styles.change, { alignItems: 'flex-end' }]}><RateChange change={entry.change} /></View>
        </View>
      ))}
    </AppCard>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: theme.SIZES.space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.COLORS.divider, gap: theme.SIZES.space.xs },
  date: { flex: 1.2 }, rate: { flex: 1 }, change: { flex: 1.2 },
});

