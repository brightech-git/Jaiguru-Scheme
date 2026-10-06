// Src/Components/SchemeCard/SchemeCard.tsx
import React, { useCallback, useRef, useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, ImageBackground, Text, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  cancelAnimation,
  withTiming,
  withSpring,
  Easing,
  useReducedMotion,
  interpolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSchemeCatalog } from '../../api/hooks/Schemes/useSchemeCatalog';
import { Scheme } from '../../types/Scheme/Scheme';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import placeholderImage from '../../Assets/Company/logo.png';
import { COLORS, SIZES, FONTS, moderateScale, ELEVATION } from '../../Utills/AppTheme';
import { IMAGE_BASE_URL } from '../../Config/BaseUrl';

const THUMB_SIZE = moderateScale(44);

function SlideToJoin({ onSlideComplete }: { onSlideComplete: () => void }) {
  const translateX = useSharedValue(0);
  const [trackWidth, setTrackWidth] = React.useState(0);
  const maxSlide = Math.max(0, trackWidth - THUMB_SIZE - 4);

  const gesture = Gesture.Pan()
    .enabled(maxSlide > 0)
    .onBegin(() => {
      cancelAnimation(translateX);
      translateX.value = 0;
    })
    .onUpdate((e) => {
      translateX.value = Math.max(0, Math.min(e.translationX, maxSlide));
    })
    .onEnd(() => {
      if (maxSlide > 0 && translateX.value >= maxSlide * 0.85) {
        translateX.value = withTiming(maxSlide, { duration: 100 });
        runOnJS(onSlideComplete)();
      } else {
        translateX.value = withSpring(0, { damping: 15 });
      }
    })
    .onFinalize(() => {
      translateX.value = withSpring(0, { duration: 400, dampingRatio: 1 });
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + THUMB_SIZE,
    backgroundColor: interpolateColor(
      translateX.value,
      [0, Math.max(1, maxSlide)],
      [COLORS.brandAlpha32, COLORS.brand],
    ),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, Math.max(1, maxSlide * 0.4)], [1, 0], 'clamp'),
  }));

  return (
    <View
      style={styles.slideTrack}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.slideFill, fillStyle]} />
      <Animated.Text style={[styles.slideLabel, labelStyle]}>
        Slide To View Terms & Join Now →
      </Animated.Text>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.slideThumb, thumbStyle]}>
          <Ionicons name="arrow-forward" size={moderateScale(20)} color={COLORS.white} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function SchemeCardSlider() {
  const { schemes, loading } = useSchemeCatalog();
  const navigation = useNavigation<any>();
  const reducedMotion = useReducedMotion() ?? false;
  const opacity = useSharedValue(1);
  React.useEffect(() => {
    if (!reducedMotion) {
      opacity.value = withRepeat(
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      opacity.value = 1;
    }
    return () => cancelAnimation(opacity);
  }, [reducedMotion, opacity]);
  const blinkStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const screenWidth = Dimensions.get('window').width;
  const HORIZONTAL_PAD = SIZES.space.lg;
  const CARD_WIDTH = screenWidth - HORIZONTAL_PAD * 3.5;
  const SNAP_INTERVAL = screenWidth;
  const IMAGE_HEIGHT = CARD_WIDTH * (9 / 16);

  const reversedSchemes = useMemo(() => [...schemes].reverse(), [schemes]);
  const handleJoinScheme = useCallback((scheme: Scheme) => {
    navigation.navigate('SchemeTermsAcceptance', { scheme });
  }, [navigation]);

  const renderItem = ({ item }: { item: Scheme & { image_path?: string } }) => {
    const imageUri = item.image_path ? `${IMAGE_BASE_URL}${item.image_path}` : placeholderImage;

    return (
      <View style={{ width: screenWidth, paddingHorizontal: HORIZONTAL_PAD }}>
        {item.SchemeId === 23 && (
          <Animated.View style={[styles.badgeOverlay, blinkStyle]}>
            <View style={styles.popularBadge}>
              <Ionicons name="flame" size={moderateScale(13)} color={COLORS.white} />
              <Text style={styles.popularBadgeText}>Most Preferable</Text>
            </View>
            <View style={styles.statsBadge}>
              <Text style={styles.statsBadgeText}>9 out of 10 choose this</Text>
            </View>
          </Animated.View>
        )}
        <View style={styles.cardContainer}>
          <ImageBackground
            source={typeof imageUri === 'string' ? { uri: imageUri } : imageUri}
            style={[styles.imageBackground, { height: IMAGE_HEIGHT }]}
            resizeMode="cover"
          />
          <View style={styles.buttonRow}>
            <SlideToJoin onSlideComplete={() => handleJoinScheme(item)} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={reversedSchemes}
        keyExtractor={(item) => item.SchemeId.toString()}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="center"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: SIZES.space.lg }}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
          setActiveIndex(index);
        }}
      />
      <View style={styles.pagination}>
        {schemes.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.paginationBar,
              i === activeIndex ? styles.paginationBarActive : styles.paginationBarInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    ...ELEVATION.floating,
  },
  imageBackground: {
    width: '100%',
  },
  buttonRow: {
    padding: SIZES.space.lg,
    backgroundColor: COLORS.surfacePage,
  },
  // Slide to join
  slideTrack: {
    height: THUMB_SIZE,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.brandTint,
    borderWidth: 1,
    borderColor: COLORS.brandAlpha32,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slideFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: SIZES.radius.pill,
  },
  slideLabel: {
    position: 'absolute',
    alignSelf: 'center',
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.sm,
    color: COLORS.contentBrand,
    letterSpacing: 0.5,
  },
  slideThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
    ...ELEVATION.raised,
  },
  badgeOverlay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SIZES.space.sm,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.space.xs,
    backgroundColor: COLORS.success,
    paddingHorizontal: SIZES.space.sm,
    paddingVertical: SIZES.space.xs,
    borderRadius: SIZES.radius.pill,
  },
  popularBadgeText: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.sm,
    color: COLORS.white,
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  statsBadge: {
    backgroundColor: COLORS.scrimHeavy,
    paddingHorizontal: SIZES.space.sm,
    paddingVertical: SIZES.space.xs,
    borderRadius: SIZES.radius.pill,
    alignSelf: 'flex-start',
  },
  statsBadgeText: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.sm,
    color: COLORS.white,
    textTransform: 'capitalize',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SIZES.space.xs,
    marginTop: SIZES.space.xs,
    marginBottom: SIZES.space.sm,
  },
  paginationBar: {
    height: 4,
    borderRadius: SIZES.radius.pill,
  },
  paginationBarActive: {
    width: moderateScale(24),
    backgroundColor: COLORS.brand,
  },
  paginationBarInactive: {
    width: moderateScale(8),
    backgroundColor: COLORS.brandAlpha32,
  },
});
