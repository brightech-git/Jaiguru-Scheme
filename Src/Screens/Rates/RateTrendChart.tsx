import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';
import { AppCard, AppText } from '../../Components/ui/appcomponents';
import theme from '../../Utills/AppTheme';
import { RateHistoryEntry } from '../../types/Rates/Rates';
import { formatDate, money } from './RateChange';

export default function RateTrendChart({ history }: { history: RateHistoryEntry[] }) {
  const values = history.map(entry => entry.rate);
  const min = Math.min(...values), max = Math.max(...values);
  const spread = max - min || max * 0.01 || 1;
  const points = values.map((value, index) => ({ x: values.length === 1 ? 150 : 10 + index / (values.length - 1) * 280, y: 130 - ((value - min) / spread) * 110 }));
  return (
    <AppCard variant="flat">
      <View style={styles.row}><AppText variant="caption">High {money(max)}</AppText><AppText variant="caption">Low {money(min)}</AppText></View>
      <View accessible accessibilityLabel={`Rate trend over ${history.length} sessions. Lowest ${money(min)}, highest ${money(max)}.`}>
        <Svg width="100%" height={160} viewBox="0 0 300 150">
          {[20, 75, 130].map(y => <Line key={y} x1={10} y1={y} x2={290} y2={y} stroke={theme.COLORS.divider} strokeDasharray="4 4" />)}
          <Polyline points={points.map(p => `${p.x},${p.y}`).join(' ')} stroke={theme.COLORS.brand} strokeWidth={3} fill="none" />
          {points.map((p, i) => <Circle key={history[i].date} cx={p.x} cy={p.y} r={3} fill={theme.COLORS.brand} />)}
        </Svg>
      </View>
      <View style={styles.row}><AppText variant="caption">{formatDate(history[0].date)}</AppText><AppText variant="caption">{formatDate(history[history.length - 1].date)}</AppText></View>
    </AppCard>
  );
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.SIZES.space.sm } });

