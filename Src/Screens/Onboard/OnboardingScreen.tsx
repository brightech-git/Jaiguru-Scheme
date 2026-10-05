// Src/Screens/Onboard/OnboardingScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

import { IMAGE_BASE_URL } from '../../Config/BaseUrl';
import { useOnboardBanners } from '../../api/hooks/Onboard/useOnboardingBanners';
import Pagination from './components/Pagination';
import { useSharedValue } from 'react-native-reanimated';
import { COLORS, FONTS } from '../../Utills/AppTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { banners, loading } = useOnboardBanners();
  const scrollX = useSharedValue(0);
  const [bannerHeight, setBannerHeight] = useState(0);

  // Skip if already authenticated
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userDataStr = await AsyncStorage.getItem('userData');
        if (token && userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData?.id) navigation.replace('MainDrawer');
        }
      } catch (_) { }
    })();
  }, [navigation]);

  const finish = useCallback(
    async (route: 'Login' | 'Register') => {
      try {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      } catch (_) { }
      navigation.replace(route);
    },
    [navigation],
  );

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = e.nativeEvent.contentOffset.x;
  }, [scrollX]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  if (!banners.length) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View
        style={styles.carousel}
        onLayout={({ nativeEvent }) => setBannerHeight(nativeEvent.layout.height)}
      >
      <FlatList
        style={styles.list}
        data={[...banners].reverse()}
        keyExtractor={(item) => String(item.BannerId)}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <Image
            source={{ uri: `${IMAGE_BASE_URL}${item.image_path}` }}
            style={[styles.bannerImage, { height: bannerHeight }]}
            resizeMode="cover"
          />
        )}
      />

      <View style={styles.curve} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 400 90" preserveAspectRatio="none">
          <Path
            d="M 0 14 C 90 -10 205 106 400 66 L 400 90 L 0 90 Z"
            fill={COLORS.white}
          />
          <Path
            d="M 0 14 C 90 -10 205 106 400 66"
            fill="none"
            stroke={COLORS.accentDeep}
            strokeWidth={3}
          />
        </Svg>
      </View>
      </View>

      {/* Fixed footer outside the image carousel. */}
      <View style={[styles.footer, { paddingBottom: insets.bottom +24 }]}>
        <Pagination count={banners.length} scrollX={scrollX} width={SCREEN_WIDTH} />

          <View style={styles.accountActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => finish('Register')}
              style={({ pressed }) => [styles.accountBtn, pressed && styles.pressed]}
            >
              <Text style={styles.accountTitle}>Register Now</Text>
              <Text style={styles.accountSubtitle}>Open a free account</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => finish('Login')}
              style={({ pressed }) => [styles.accountBtn, styles.loginBtn, pressed && styles.pressed]}
            >
              <Text style={[styles.accountTitle, styles.loginText]}>Login</Text>
              <Text style={[styles.accountSubtitle, styles.loginText]}>Already have an account</Text>
            </Pressable>
          </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  carousel: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  curve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 90,
  },
  list: { flex: 1, width: SCREEN_WIDTH },
  bannerImage: { width: SCREEN_WIDTH },
  footer: {
    paddingTop: 6,
    paddingHorizontal: 28,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  accountActions: {
    marginTop: 18,
    width: '100%',
    gap: 12,
  },
  accountBtn: {
    minHeight: 58,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.brandStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  accountTitle: {
    fontSize: 18,
    color: COLORS.contentOnBrand,
    fontFamily: FONTS.family.semiBold,
  },
  accountSubtitle: {
      fontSize: 15,
      color: COLORS.contentOnBrand,
      fontFamily: FONTS.family.semiBold,
      textAlign: 'center',
  },
  loginBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brandStrong,
  },
  loginText: { color: COLORS.brandStrong ,fontFamily: FONTS.family.semiBold},
  pressed: { opacity: 0.7 },
});

export default OnboardingScreen;
