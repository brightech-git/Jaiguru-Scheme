import { Text } from '../../../Components/Typography/FontText';
// Src/Screens/Auth/Login/Login.tsx
// -----------------------------------------------------------------------------
// Jaiguru Digi Gold — premium luxury Login screen.
// Full-bleed champagne background + floating gold particles, shimmering logo,
// glassmorphism login card, gold-gradient CTA, social/guest actions and a trust
// footer. All auth behaviour lives in the useLogin hook; UI is fully modular.
// Everything is themed via the global AppTheme (no local styling constants).
//
//   components/  LoginHeader · LoginForm · LoginButton · SocialActions · Footer
//   hooks/       useLogin
//   validation/  loginSchema
// -----------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { Dimensions, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import theme from '../../../Utills/AppTheme';
import { useCompany } from '../../../api/hooks/Company/useCompany';
import { useLogin } from './hooks/useLogin';
import LoginHeader from './components/LoginHeader';
import LoginForm from './components/LoginForm';
import SocialActions from './components/SocialActions';
import Footer from './components/Footer';
import GoldParticles from './components/GoldParticles';

const { COLORS, SIZES, FONTS } = theme;
const { width, height } = Dimensions.get('window');

const BG_GRADIENT = COLORS.gradient.accentWash as [string, string, string];
const GLOW_GRADIENT = [COLORS.accentSubtle, COLORS.whiteAlpha10] as [string, string];

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { company } = useCompany();
  const form = useLogin();

  // Entrance animation for the welcome + card block (fade + slide-up).
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [enter]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: interpolate(enter.value, [0, 1], [34, 0]) }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Full-bleed luxury background + floating particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
        <View style={[styles.glow, styles.glowTop]}>
          <LinearGradient
            colors={GLOW_GRADIENT}
            style={styles.glowFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>
        <GoldParticles width={width} height={height} />
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <LoginHeader logoUrl={company?.CompanyLogoUrl ?? null} />

              <Animated.View style={contentStyle}>
                <View style={styles.welcome}>
                  <Text style={styles.welcomeTitle}>Welcome Back</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Continue Your Digital Gold Savings Journey Securely Now.
                  </Text>
                </View>

                <LoginForm
                  contactNumber={form.contactNumber}
                  remember={form.remember}
                  errors={form.errors}
                  loading={form.loading}
                  isBusy={form.isBusy}
                  onChangeContactNumber={form.onChangeContactNumber}
                  onBlurField={form.onBlurField}
                  toggleRemember={form.toggleRemember}
                  onSubmit={form.submit}
                />

                <SocialActions
                  onCreateAccount={form.goToRegister}
                  onGoogle={form.signInWithGoogle}
                  onApple={form.signInWithApple}
                  onGuest={form.continueAsGuest}
                  googleLoading={form.googleLoading}
                  appleLoading={form.appleLoading}
                  disabled={form.isBusy}
                />

                {/* <Footer trustedSince="1985" onPrivacy={goToPrivacy} onTerms={goToTerms} /> */}
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>

      <form.Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surfacePage,
  },
  flex: { flex: 1 },
  safe: { flex: 1 },
  glow: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    overflow: 'hidden',
  },
  glowTop: {
    top: -width * 0.55,
    alignSelf: 'center',
  },
  glowFill: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SIZES.space.gutter,
    paddingTop: SIZES.space.lg,
    paddingBottom: SIZES.space.xxxl,
  },
  welcome: {
    alignItems: 'center',
    marginTop: SIZES.space.xxl,
    marginBottom: SIZES.space.lg,
  },
  welcomeTitle: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.display3,
    letterSpacing: -0.3,
    color: COLORS.contentPrimary,
  },
  welcomeSubtitle: {
   fontFamily: FONTS.family.semiBold,
    fontSize: 12.9,
    lineHeight: SIZES.text.md * 1.5,
    textAlign: 'center',
    color: COLORS.contentSecondary,
    marginTop: SIZES.space.xs,
    maxWidth: 300,
  },
});

export default LoginScreen;
