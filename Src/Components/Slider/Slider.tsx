import { Text } from '../Typography/FontText';
// Src/Components/Slider/Slider.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Image, ActivityIndicator, Animated, StyleSheet, FlatList, Dimensions, TouchableOpacity, ViewToken } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSchemeSliders } from '../../api/hooks/HomeBanner/useSchemeSliders';
import { useSchemeCatalog } from '../../api/hooks/Schemes/useSchemeCatalog';
import { SchemeSlider } from '../../types/HomeBanner/HomeBanner';
import { IMAGE_BASE_URL } from '../../Config/BaseUrl';
import { COLORS, SIZES, FONTS, ELEVATION, moderateScale } from '../../Utills/AppTheme';

// index 0 → MemberCreation, rest → WebView URLs in order
const SLIDE_LINKS: Array<{ type: 'screen'; screen: string } | { type: 'web'; url: string; title: string }> = [
  { type: 'screen', screen: 'MemberCreation' },
  { type: 'web', url: 'https://jaigurujewellers.com/', title: 'Jaiguru Jewellers' },
  { type: 'web', url: 'https://jaigurujewellers.com/', title: 'Jaiguru Jewellers' },
  { type: 'web', url: 'https://jaigurujewellers.com/', title: 'Jaiguru Jewellers' },
];

const { width } = Dimensions.get('window');

const SlideItem = React.memo(({ item, index, onPress }: { item: SchemeSlider; index: number; onPress: (i: number) => void }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const onLoad = () => Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  return (
    <TouchableOpacity style={styles.slide} activeOpacity={0.9} onPress={() => onPress(index)}>
      <View style={[styles.image, { backgroundColor: COLORS.surfaceMuted, overflow: 'hidden' }]}>
        <Animated.Image
          source={{ uri: `${IMAGE_BASE_URL}${item.image_path}` }}
          style={[styles.image, { opacity }]}
          resizeMode="cover"
          onLoad={onLoad}
        />
      </View>
    </TouchableOpacity>
  );
});

const SliderComponentSimple = () => {
  const navigation = useNavigation<any>();
  const { sliders, loading, error } = useSchemeSliders();
  const { schemes } = useSchemeCatalog();

  const handleSlidePress = (index: number) => {
    const link = SLIDE_LINKS[index];
    if (!link) return;
    if (link.type === 'screen') {
      // Pass the first available scheme (SchemeId 17) to MemberCreation
      const scheme = schemes?.[0] || null;
      navigation.navigate(link.screen, { scheme });
    } else {
      navigation.navigate('WebViewScreen', { url: link.url, title: link.title });
    }
  };
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<SchemeSlider>>(null);
  const isManualScroll = useRef(false);

  // Auto-scroll every 4 seconds
  useEffect(() => {
    if (!sliders || sliders.length <= 1) return;
    const interval = setInterval(() => {
      if (isManualScroll.current) return;
      setCurrentIndex((prev) => {
        const next = (prev + 1) % sliders.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [sliders]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleDotPress = (index: number) => {
    isManualScroll.current = true;
    setCurrentIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setTimeout(() => { isManualScroll.current = false; }, 500);
  };

  if (loading) {
    return (
      <View style={styles.skeletonWrap}>
        <View style={styles.skeleton} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load sliders</Text>
      </View>
    );
  }

  if (!sliders || sliders.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={[...sliders].reverse()}
        keyExtractor={(item, index) => (item as any).SliderId?.toString() ?? `slider-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => <SlideItem item={item} index={index} onPress={handleSlidePress} />}
      />

      {/* Pagination Dots */}
      {sliders.length > 1 && (
        <View style={styles.pagination}>
          {[...sliders].reverse().map((_, index) => (
            <TouchableOpacity key={index} onPress={() => handleDotPress(index)} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <View style={[styles.dot, index === currentIndex && styles.activeDot]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SIZES.space.md,
    marginTop: SIZES.space.md,
  },
  slide: {
    width: width,
    paddingHorizontal: SIZES.space.gutter,
  },
  image: {
    width: '100%',
    height: (width - SIZES.space.gutter * 2) * (9 / 16),
    borderRadius: SIZES.radius.lg,
    backgroundColor: COLORS.surfaceMuted,
    ...ELEVATION.floating,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.space.md,
  },
  dot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.borderStrong,
    marginHorizontal: SIZES.space.xs / 2,
  },
  activeDot: {
    width: moderateScale(24),
    backgroundColor: COLORS.brand,
  },
  skeletonWrap: {
    width: '100%',
    paddingHorizontal: SIZES.space.gutter,
    marginBottom: SIZES.space.md,
    marginTop: SIZES.space.md,
  },
  skeleton: {
    width: '100%',
    height: (width - SIZES.space.gutter * 2) * (9 / 16),
    borderRadius: SIZES.radius.lg,
    backgroundColor: COLORS.surfaceMuted,
  },
  loadingContainer: {
    width: '100%',
    height: moderateScale(180),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    marginHorizontal: SIZES.space.gutter,
    borderRadius: SIZES.radius.lg,
    marginBottom: SIZES.space.md,
  },
  errorContainer: {
    width: '100%',
    height: moderateScale(100),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    marginHorizontal: SIZES.space.gutter,
    borderRadius: SIZES.radius.lg,
    marginBottom: SIZES.space.md,
  },
  errorText: {
    ...FONTS.bodySm,
    color: COLORS.contentOnBrand,
  },
});

export default SliderComponentSimple;
