import { Text } from '../../../Components/Typography/FontText';
// Src/Screens/Onboard/components/Illustrations.tsx
// -----------------------------------------------------------------------------
// Premium, fully-vector jewellery illustrations (no image assets needed).
// Each illustration = glowing gradient medallion + floating ornaments +
// glassmorphism accent cards, themed in champagne gold.
// -----------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import theme from '../../../Utills/AppTheme';
import {
  CHAMPAGNE,
  GOLD,
  GOLD_DEEP,
  GOLD_LIGHT,
  INK,
  INK_SOFT,
  type OnboardingSlide,
} from '../data';
import FloatingElement from './FloatingElement';

const MEDALLION = 200;

/** Softly pulsing concentric glow rings behind the hero medallion. */
const GlowRings: React.FC = () => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const outer = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.06 * pulse.value }],
    opacity: 0.35 + 0.25 * pulse.value,
  }));
  const inner = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.03 * pulse.value }],
    opacity: 0.5 + 0.3 * pulse.value,
  }));

  return (
    <>
      <Animated.View style={[styles.ring, styles.ringOuter, outer]} />
      <Animated.View style={[styles.ring, styles.ringInner, inner]} />
    </>
  );
};

/** Floating ornaments (diamonds/sparkles) positioned around the medallion. */
const Ornaments: React.FC<{ slide: OnboardingSlide; size: number }> = ({ slide, size }) => (
  <>
    {slide.ornaments.map((o, i) => (
      <FloatingElement
        key={`${slide.id}-orn-${i}`}
        amplitude={o.amplitude}
        delay={o.delay}
        duration={2800 + i * 250}
        style={[
          styles.ornament,
          { left: o.x * size - o.size / 2, top: o.y * size - o.size / 2 },
        ]}
      >
        <MaterialCommunityIcons name={o.icon} size={o.size} color={o.color} />
      </FloatingElement>
    ))}
  </>
);

/** The shared glowing gradient medallion with the hero icon. */
const HeroMedallion: React.FC<{ slide: OnboardingSlide }> = ({ slide }) => (
  <View style={styles.medallionWrap}>
    <GlowRings />
    <FloatingElement amplitude={8} duration={4200}>
      <LinearGradient
        colors={slide.heroGradient}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={styles.medallion}
      >
        <View style={styles.medallionInner}>
          <MaterialCommunityIcons name={slide.heroIcon} size={78} color={GOLD_DEEP} />
        </View>
      </LinearGradient>
    </FloatingElement>
  </View>
);

/** Glassmorphism category chips for the collections slide. */
const CollectionsOverlay: React.FC<{ slide: OnboardingSlide }> = ({ slide }) => {
  if (!slide.collections) return null;
  return (
    <View style={styles.collectionsWrap} pointerEvents="none">
      {slide.collections.map((c, i) => (
        <FloatingElement
          key={c.label}
          amplitude={6 + (i % 3) * 2}
          delay={i * 180}
          duration={3400 + i * 200}
          style={[styles.chip, chipPosition(i)]}
        >
          <BlurView intensity={40} tint="light" style={styles.chipBlur}>
            <View style={styles.chipIcon}>
              <MaterialCommunityIcons name={c.icon} size={16} color={GOLD_DEEP} />
            </View>
            <Text style={styles.chipText}>{c.label}</Text>
          </BlurView>
        </FloatingElement>
      ))}
    </View>
  );
};

/** Positions the 6 collection chips around the medallion. */
const chipPosition = (i: number) => {
  const map = [
    { top: 6, left: -6 },
    { top: 0, right: -8 },
    { top: 96, left: -30 },
    { top: 108, right: -26 },
    { bottom: 8, left: 6 },
    { bottom: 2, right: 4 },
  ] as const;
  return map[i % map.length];
};

/** Glassmorphism "dashboard" card with feature rows for the features slide. */
const FeaturesOverlay: React.FC<{ slide: OnboardingSlide }> = ({ slide }) => {
  if (!slide.features) return null;
  return (
    <BlurView intensity={45} tint="light" style={styles.dashboard}>
      <View style={styles.dashboardHeader}>
        <MaterialCommunityIcons name="crown" size={16} color={GOLD_DEEP} />
        <Text style={styles.dashboardTitle}>Jaiguru Dashboard</Text>
      </View>
      <View style={styles.featureGrid}>
        {slide.features.map((f) => (
          <View key={f.label} style={styles.featureRow}>
            <LinearGradient
              colors={[GOLD_LIGHT, GOLD]}
              style={styles.featureIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name={f.icon} size={15} color={GOLD_DEEP} />
            </LinearGradient>
            <Text style={styles.featureLabel} numberOfLines={1}>
              {f.label}
            </Text>
            <MaterialCommunityIcons name="check-circle" size={14} color={theme.COLORS.success} />
          </View>
        ))}
      </View>
    </BlurView>
  );
};

export interface IllustrationProps {
  slide: OnboardingSlide;
}

/** Public illustration router — renders the right composition per slide. */
const Illustration: React.FC<IllustrationProps> = ({ slide }) => {
  return (
    <View style={styles.stage}>
      {/* Soft champagne backdrop glow */}
      <LinearGradient
        colors={[CHAMPAGNE, 'rgba(255,255,255,0)']}
        style={styles.backdropGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {slide.illustration === 'features' ? (
        <View style={styles.featuresStage}>
          <HeroMedallion slide={slide} />
          <FeaturesOverlay slide={slide} />
        </View>
      ) : (
        <View style={styles.centerStage}>
          <HeroMedallion slide={slide} />
          {slide.illustration === 'collections' && <CollectionsOverlay slide={slide} />}
        </View>
      )}

      <Ornaments slide={slide} size={MEDALLION + 120} />
    </View>
  );
};

const styles = StyleSheet.create({
  stage: {
    width: MEDALLION + 120,
    height: MEDALLION + 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdropGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: (MEDALLION + 120) / 2,
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionWrap: {
    width: MEDALLION,
    height: MEDALLION,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallion: {
    width: MEDALLION,
    height: MEDALLION,
    borderRadius: MEDALLION / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.ELEVATION.brandGlow,
  },
  medallionInner: {
    width: MEDALLION - 34,
    height: MEDALLION - 34,
    borderRadius: (MEDALLION - 34) / 2,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  ringOuter: {
    width: MEDALLION + 70,
    height: MEDALLION + 70,
  },
  ringInner: {
    width: MEDALLION + 30,
    height: MEDALLION + 30,
    borderColor: GOLD_LIGHT,
  },
  ornament: {
    position: 'absolute',
  },
  // Collections chips
  collectionsWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    position: 'absolute',
    borderRadius: 24,
    overflow: 'hidden',
    ...theme.ELEVATION.raised,
  },
  chipBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    borderRadius: 24,
  },
  chipIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: CHAMPAGNE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  chipText: {
    fontFamily: theme.FONTS.family.semiBold,
    fontSize: 12,
    color: INK,
  },
  // Features dashboard
  dashboard: {
    position: 'absolute',
    bottom: -6,
    width: 250,
    borderRadius: 22,
    overflow: 'hidden',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    ...theme.ELEVATION.floating,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dashboardTitle: {
    fontFamily: theme.FONTS.family.semiBold,
    fontSize: 12,
    color: INK,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureRow: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  featureLabel: {
    flex: 1,
    fontFamily: theme.FONTS.family.medium,
    fontSize: 10.5,
    color: INK_SOFT,
    marginRight: 3,
  },
});

export default React.memo(Illustration);
