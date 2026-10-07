import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../Components/ui/appcomponents';
import { COLORS, SIZES, ELEVATION } from '../../../Utills/AppTheme';

export default function ShowroomLocatorCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Find a Jai Guru showroom" style={styles.card}>
      <LinearGradient colors={[COLORS.successSurface, COLORS.accentSoft]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.content}>
        <View style={styles.map}>
          <MaterialCommunityIcons name="map-outline" size={42} color={COLORS.successText} />
          <MaterialCommunityIcons name="map-marker" size={27} color={COLORS.brand} style={styles.pin} />
        </View>
        <View style={styles.copy}>
          <AppText variant="captionBold" color={COLORS.contentSecondary}>Find your nearest branch on the map</AppText>
          <AppText variant="bodyBold" color={COLORS.brand}>JAI GURU SHOWROOM</AppText>
          <AppText variant="captionBold" color={COLORS.contentSecondary}>3 branches · Directions & calls</AppText>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.brand} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: SIZES.space.gutter, marginTop: SIZES.space.lg, borderRadius: SIZES.radius.md, ...ELEVATION.raised },
  content: { borderRadius: SIZES.radius.md, flexDirection: 'row', alignItems: 'center', padding: SIZES.space.md, gap: SIZES.space.md, borderWidth: 1, borderColor: COLORS.accentSubtle },
  map: { width: 48, height: 48, alignItems: 'center', justifyContent: 'flex-end' },
  pin: { position: 'absolute', top: -3, right: 3 },
  copy: { flex: 1 },
});
