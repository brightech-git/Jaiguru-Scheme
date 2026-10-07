import { Text } from '../../Components/Typography/FontText';
// Src/Screens/Onboard/OnboardingIllustration.tsx
// -----------------------------------------------------------------------------
// Jaiguru Jewellers — premium 4-screen onboarding (illustration version).
// Horizontal swipe (Reanimated-driven), animated luxury background, glass cards,
// gold-gradient CTA, smooth page indicator and parallax hero illustrations.
// -----------------------------------------------------------------------------

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Platform, Pressable, StatusBar, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type ViewToken } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import theme from '../../Utills/AppTheme';
import { CHAMPAGNE, GOLD_DEEP, INK_SOFT, ONBOARDING_DATA, type OnboardingSlide } from './data';
import OnboardingItem from './components/OnboardingItem';
import Pagination from './components/Pagination';
import NextButton from './components/NextButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<OnboardingSlide>);

const OnboardingIllustration: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const scrollX = useSharedValue(0);
  const drift = useSharedValue(0);
  const [index, setIndex] = useState(0);

  const isLast = index === ONBOARDING_DATA.length - 1;

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [drift]);

  const blobA = useAnimatedStyle(() => ({
    transform: [
      { translateX: -40 + 30 * drift.value },
      { translateY: -30 + 25 * drift.value },
      { scale: 1 + 0.08 * drift.value },
    ],
  }));
  const blobB = useAnimatedStyle(() => ({
    transform: [
      { translateX: 30 - 30 * drift.value },
      { translateY: 20 - 20 * drift.value },
      { scale: 1.1 - 0.08 * drift.value },
    ],
  }));

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
    },
  ).current;

  const viewabilityConfig = useMemo(() => ({ viewAreaCoveragePercentThreshold: 55 }), []);

  const onMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userDataStr = await AsyncStorage.getItem('userData');
        if (token && userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData?.id) navigation.replace('MainDrawer');
        }
      } catch (err) {
        console.log('Onboarding auth check failed', err);
      }
    })();
  }, [navigation]);

  const finish = useCallback(
    async (route: 'Login' | 'Register') => {
      try {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      } catch (err) {
        console.log('Failed to persist onboarding flag', err);
      } finally {
        navigation.replace(route);
      }
    },
    [navigation],
  );

  const goNext = useCallback(() => {
    if (isLast) {
      finish('Register');
      return;
    }
    listRef.current?.scrollToOffset({ offset: (index + 1) * SCREEN_WIDTH, animated: true });
  }, [finish, index, isLast]);

  const skip = useCallback(() => finish('Login'), [finish]);

  const renderItem = useCallback(
    ({ item, index: i }: { item: OnboardingSlide; index: number }) => (
      <OnboardingItem slide={item} index={i} scrollX={scrollX} width={SCREEN_WIDTH} />
    ),
    [scrollX],
  );

  const lastSlide = ONBOARDING_DATA[ONBOARDING_DATA.length - 1];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={['#FFFFFF', '#FFFDF7', '#FBF4E6']} style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.blob, styles.blobTop, blobA]}>
          <LinearGradient
            colors={[CHAMPAGNE, 'rgba(255,255,255,0)']}
            style={styles.blobFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
        <Animated.View style={[styles.blob, styles.blobBottom, blobB]}>
          <LinearGradient
            colors={['rgba(212,175,55,0.16)', 'rgba(255,255,255,0)']}
            style={styles.blobFill}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
          />
        </Animated.View>
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.brand}>
          Jaiguru <Text style={styles.brandAccent}>Jewellers</Text>
        </Text>
        {!isLast && (
          <Pressable
            onPress={skip}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            style={({ pressed }) => [styles.skipBtn, pressed && styles.skipPressed]}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      <AnimatedFlatList
        ref={listRef}
        data={ONBOARDING_DATA}
        keyExtractor={(item) => (item as OnboardingSlide).id}
        renderItem={renderItem as any}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onMomentumScrollEnd={onMomentumEnd}
        decelerationRate="fast"
        style={styles.list}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
        <Pagination count={ONBOARDING_DATA.length} scrollX={scrollX} width={SCREEN_WIDTH} />

        <View style={styles.ctaWrap}>
          <NextButton
            label={ONBOARDING_DATA[index]?.primaryLabel ?? 'Continue'}
            onPress={goNext}
            showArrow={!isLast}
            accessibilityHint={isLast ? 'Completes onboarding' : 'Goes to the next screen'}
          />

          {isLast && lastSlide.secondaryLabel && (
            <Pressable
              onPress={() => finish('Login')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={lastSlide.secondaryLabel}
              style={({ pressed }) => [styles.loginBtn, pressed && styles.loginPressed]}
            >
              <Text style={styles.loginText}>
                Already a member?{' '}
                <Text style={styles.loginLink}>{lastSlide.secondaryLabel}</Text>
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.COLORS.surface,
  },
  blob: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.3,
    height: SCREEN_WIDTH * 1.3,
    borderRadius: SCREEN_WIDTH * 0.65,
    overflow: 'hidden',
  },
  blobFill: { flex: 1 },
  blobTop: {
    top: -SCREEN_WIDTH * 0.45,
    left: -SCREEN_WIDTH * 0.2,
  },
  blobBottom: {
    bottom: -SCREEN_WIDTH * 0.5,
    right: -SCREEN_WIDTH * 0.25,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 6,
    zIndex: 5,
  },
  brand: {
    fontFamily: theme.FONTS.family.bold,
    fontSize: 16,
    letterSpacing: 0.5,
    color: theme.COLORS.contentPrimary,
  },
  brandAccent: {
    color: GOLD_DEEP,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  skipPressed: { opacity: 0.6 },
  skipText: {
    fontFamily: theme.FONTS.family.semiBold,
    fontSize: 13,
    color: GOLD_DEEP,
    letterSpacing: 0.3,
  },
  list: { flex: 1 },
  footer: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 44,
  },
  ctaWrap: {
    marginTop: 22,
    alignItems: 'center',
  },
  loginBtn: {
    marginTop: 16,
    paddingVertical: 6,
  },
  loginPressed: { opacity: 0.6 },
  loginText: {
    fontFamily: theme.FONTS.family.regular,
    fontSize: 14,
    color: INK_SOFT,
  },
  loginLink: {
    fontFamily: theme.FONTS.family.bold,
    color: GOLD_DEEP,
  },
});

export default OnboardingIllustration;
