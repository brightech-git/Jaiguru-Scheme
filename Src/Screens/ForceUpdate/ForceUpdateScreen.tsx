import { Text } from '../../Components/Typography/FontText';
// Src/Screens/ForceUpdate/ForceUpdateScreen.tsx
import React, { useEffect } from 'react';
import { Dimensions, Image, Linking, Platform, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import theme from '../../Utills/AppTheme';
import appLogo from '../../Assets/Company/logo.png';

const { COLORS, SIZES, FONTS } = theme;
const { width } = Dimensions.get('window');

interface Props {
  currentVersion?: string;
  latestVersion?: string;
  storeUrl?: string | null;
}

const ForceUpdateScreen: React.FC<Props> = ({ currentVersion, latestVersion, storeUrl }) => {
  const pulse = useSharedValue(1);
  const float = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    float.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulse, float]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }, { translateY: float.value }],
  }));

  const FALLBACK_STORE_URL = Platform.OS === 'ios'
    ? 'https://apps.apple.com/app/id6795536260'
    : 'https://play.google.com/store/apps/details?id=com.brightechsoftware.jaiguruscheme2';

  const handleUpdate = () => {
    Linking.openURL(storeUrl || FALLBACK_STORE_URL).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={[COLORS.brandDeep, COLORS.brand, COLORS.brandMuted]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      <View style={[styles.glow, styles.glowTop]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottom]} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Image source={appLogo} style={styles.logo} resizeMode="contain" />

          <Animated.View style={[styles.iconWrap, iconStyle]}>
            <LinearGradient
              colors={[COLORS.accentSoft, COLORS.accentDeep]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="cloud-download-outline" size={52} color={COLORS.brand} />
            </LinearGradient>
          </Animated.View>

          <Text style={styles.title}>Update Required</Text>

          <View style={styles.divider} />

          <Text style={styles.message}>
            A new version of the app is available and this update is required to continue.
            {latestVersion ? ` Please update to version ${latestVersion} to proceed.` : ''}
          </Text>

          {currentVersion ? (
            <Text style={styles.versionText}>
              Installed version: {currentVersion}
              {latestVersion ? `  •  Latest: ${latestVersion}` : ''}
            </Text>
          ) : null}

          <TouchableOpacity
            style={styles.updateButton}
            activeOpacity={0.85}
            onPress={handleUpdate}
          >
            <MaterialCommunityIcons name="download" size={20} color={COLORS.brand} style={styles.updateButtonIcon} />
            <Text style={styles.updateButtonText}>Update Now</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            You won't be able to use the app until it's updated.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.space.gutter,
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: SIZES.space.xxl,
    borderRadius: SIZES.radius.lg,
  },
  iconWrap: {
    marginBottom: SIZES.space.xxl,
    borderRadius: SIZES.radius.pill,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.display3,
    color: COLORS.contentOnBrand,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: SIZES.space.lg,
  },
  divider: {
    width: 60,
    height: 3,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.accentDeep,
    marginBottom: SIZES.space.xl,
  },
  message: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.lg,
    color: COLORS.whiteAlpha80,
    textAlign: 'center',
    lineHeight: SIZES.text.lg * 1.6,
    marginBottom: SIZES.space.lg,
    maxWidth: width * 0.82,
  },
  versionText: {
    fontFamily: FONTS.family.medium,
    fontSize: SIZES.text.sm,
    color: COLORS.whiteAlpha50,
    textAlign: 'center',
    marginBottom: SIZES.space.xxxl,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.contentOnBrand,
    borderRadius: SIZES.radius.pill,
    paddingHorizontal: SIZES.space.xxl,
    paddingVertical: SIZES.space.md,
    marginBottom: SIZES.space.xxl,
  },
  updateButtonIcon: {
    marginRight: SIZES.space.sm,
  },
  updateButtonText: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.lg,
    color: COLORS.brand,
  },
  footer: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.sm,
    color: COLORS.whiteAlpha50,
    textAlign: 'center',
  },
  glow: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: COLORS.whiteAlpha10,
  },
  glowTop: { top: -width * 0.5, alignSelf: 'center' },
  glowBottom: { bottom: -width * 0.6, alignSelf: 'center' },
});

export default ForceUpdateScreen;
