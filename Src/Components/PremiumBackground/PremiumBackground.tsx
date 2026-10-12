// Src/Components/PremiumBackground/PremiumBackground.tsx
// -----------------------------------------------------------------------------
// Reusable full-bleed luxury backdrop: champagne gradient + floating gold
// particles. Drop it as the first child of a screen root (pointerEvents none)
// and set the screen's own container background to transparent.
// -----------------------------------------------------------------------------

import React from 'react';
import { useWindowDimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import theme from '../../Utills/AppTheme';
import GoldParticles from '../../Screens/Auth/Login/components/GoldParticles';

const { COLORS } = theme;
const BG_GRADIENT = COLORS.gradient.accentWash as [string, string, string];

export interface PremiumBackgroundProps {
  /** Show floating gold particles (default true). */
  particles?: boolean;
}

const PremiumBackground: React.FC<PremiumBackgroundProps> = ({ particles = true }) => {
  const { width, height } = useWindowDimensions();
  return (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
    {particles && <GoldParticles width={width} height={height} />}
  </View>
);
};

export default React.memo(PremiumBackground);
