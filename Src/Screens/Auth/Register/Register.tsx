import React, { useEffect } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
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
import { useRegister } from './hooks/useRegister';
import RegisterForm from './components/RegisterForm';
import RegisterButton from './components/RegisterButton';
import RegisterHeader from './components/RegisterHeader';
import GoldParticles from '../Login/components/GoldParticles';
import SocialActions from '../Login/components/SocialActions';

const { COLORS, SIZES } = theme;
const { width, height } = Dimensions.get('window');

const BG_GRADIENT = COLORS.gradient.accentWash as [string, string, string];
const GLOW_GRADIENT = [COLORS.accentSubtle, COLORS.whiteAlpha10] as [string, string];

const RegisterScreen: React.FC = () => {
  const reg = useRegister();
  const { control, formState } = reg.form;
  const { errors } = formState;

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
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <RegisterHeader
                title="Join Now"
                subtitle="Enter your contact number to get started."
              />

              <Animated.View style={[styles.body, contentStyle]}>
                <RegisterForm
                  control={control}
                  errors={errors}
                  disabled={reg.loading}
                />

                <View style={styles.buttonWrap}>
                  <RegisterButton
                    label="Joining Now"
                    onPress={reg.submit}
                    loading={reg.loading}
                    success={false}
                  />
                </View>

                <SocialActions
                  onCreateAccount={reg.goToLogin}
                  onGoogle={() => {}}
                  onApple={() => {}}
                  onGuest={() => {}}
                  googleLoading={false}
                  appleLoading={false}
                  disabled={reg.loading}
                  accountLabel="Already have an account? "
                  accountLinkLabel="Login"
                />
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <reg.Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surfacePage },
  flex: { flex: 1 },
  safe: { flex: 1 },
  glow: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    overflow: 'hidden',
  },
  glowTop: { top: -width * 0.55, alignSelf: 'center' },
  glowFill: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SIZES.space.gutter,
    paddingTop: SIZES.space.sm,
    paddingBottom: SIZES.space.xxxl,
  },
  body: { marginTop: SIZES.space.sm },
  buttonWrap: { marginTop: SIZES.space.lg },
});

export default RegisterScreen;
