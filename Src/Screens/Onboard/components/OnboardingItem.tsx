import { Text } from '../../../Components/Typography/FontText';
// Src/Screens/Onboard/components/OnboardingItem.tsx
// -----------------------------------------------------------------------------
// A single onboarding page. Drives two scroll-linked animations:
//   • Illustration parallax (moves slower than the page → depth)
//   • Text fade-in + slide-up as the page settles into view
// -----------------------------------------------------------------------------

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import theme from '../../../Utills/AppTheme';
import { GOLD_DEEP, INK, INK_SOFT, type OnboardingSlide } from '../data';
import Illustration from './Illustrations';

export interface OnboardingItemProps {
  slide: OnboardingSlide;
  index: number;
  scrollX: SharedValue<number>;
  width: number;
}

const OnboardingItem: React.FC<OnboardingItemProps> = ({ slide, index, scrollX, width }) => {
  const input = [(index - 1) * width, index * width, (index + 1) * width];

  const illustrationStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      input,
      [width * 0.28, 0, -width * 0.28],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      scrollX.value,
      input,
      [0.82, 1, 0.82],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      input,
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateX }, { scale }], opacity };
  });

  const textStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollX.value,
      input,
      [40, 0, 40],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      input,
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }], opacity };
  });

  const renderTitle = () => {
    if (!slide.highlight || !slide.title.includes(slide.highlight)) {
      return <Text style={styles.title}>{slide.title}</Text>;
    }
    const [before, after] = slide.title.split(slide.highlight);
    return (
      <Text style={styles.title}>
        {before}
        <Text style={styles.titleHighlight}>{slide.highlight}</Text>
        {after}
      </Text>
    );
  };

  return (
    <View style={[styles.page, { width }]}>
      <Animated.View style={[styles.illustration, illustrationStyle]}>
        <Illustration slide={slide} />
      </Animated.View>

      <Animated.View style={[styles.textBlock, textStyle]}>
        <View style={styles.eyebrowWrap}>
          <View style={styles.eyebrowLine} />
          <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
          <View style={styles.eyebrowLine} />
        </View>
        {renderTitle()}
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  illustration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  eyebrowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  eyebrowLine: {
    width: 22,
    height: 1,
    backgroundColor: GOLD_DEEP,
    opacity: 0.5,
    marginHorizontal: 8,
  },
  eyebrow: {
    fontFamily: theme.FONTS.family.semiBold,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: GOLD_DEEP,
  },
  title: {
    fontFamily: theme.FONTS.family.bold,
    fontSize: 27,
    lineHeight: 34,
    textAlign: 'center',
    color: INK,
    letterSpacing: -0.3,
  },
  titleHighlight: {
    color: GOLD_DEEP,
  },
  subtitle: {
    fontFamily: theme.FONTS.family.regular,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    color: INK_SOFT,
    marginTop: 14,
    maxWidth: 320,
  },
});

export default React.memo(OnboardingItem);
