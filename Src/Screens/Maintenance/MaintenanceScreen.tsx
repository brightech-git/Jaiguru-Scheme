import { Text } from '../../Components/Typography/FontText';
// Src/Screens/Maintenance/MaintenanceScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StatusBar, StyleSheet, TextInput, View } from 'react-native';
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
  message?: string;
  onUnlock?: () => void;
}

const MaintenanceScreen: React.FC<Props> = ({
  message = 'The app is currently under maintenance. Please try again later.',
  onUnlock,
}) => {
  const taps = useRef(0);
  const [showAccess, setShowAccess] = useState(false);
  const [password, setPassword] = useState('');
  const [accessError, setAccessError] = useState('');
  const closeAccess = () => { setShowAccess(false); setPassword(''); setAccessError(''); };
  const tapLogo = () => {
    taps.current += 1;
    if (taps.current >= 3) { taps.current = 0; setShowAccess(true); }
  };
  const unlock = () => {
    if (password !== 'JAIGURU@321') { setAccessError('Incorrect password. Please try again.'); return; }
    closeAccess();
    onUnlock?.();
  };
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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={[COLORS.brandDeep, COLORS.brand, COLORS.brandMuted]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* Decorative glow circles */}
      <View style={[styles.glow, styles.glowTop]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottom]} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>

          {/* Logo */}
          <Pressable accessibilityRole="button" accessibilityLabel="Company logo" onPress={tapLogo}>
            <Image source={appLogo} style={styles.logo} resizeMode="contain" />
          </Pressable>

          {/* Animated wrench icon */}
          <Animated.View style={[styles.iconWrap, iconStyle]}>
            <LinearGradient
              colors={[COLORS.accentSoft, COLORS.accentDeep]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons
                name="wrench-clock"
                size={52}
                color={COLORS.brand}
              />
            </LinearGradient>
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>Under Maintenance</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Message from API */}
          <Text style={styles.message}>{message}</Text>

          {/* Feature enrichment chips */}
          <View style={styles.chipsRow}>
            {['✨ Enhancing Features', '🚀 Performance Boost', '🔒 Security Updates'].map(
              (label) => (
                <View key={label} style={styles.chip}>
                  <Text style={styles.chipText}>{label}</Text>
                </View>
              )
            )}
          </View>

          <Text style={styles.footer}>
            We'll be back shortly. Thank you for your patience!
          </Text>
        </View>
      </SafeAreaView>
      <Modal visible={showAccess} transparent animationType="fade" onRequestClose={closeAccess}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.accessBackdrop}>
          <View style={styles.accessCard} accessibilityViewIsModal>
            <Text style={styles.accessTitle}>Member Access</Text>
            <TextInput value={password} onChangeText={value => { setPassword(value); setAccessError(''); }} secureTextEntry autoCapitalize="none" autoCorrect={false} autoFocus placeholder="Enter access password" placeholderTextColor={COLORS.contentMuted} style={styles.accessInput} accessibilityLabel="Maintenance access password" onSubmitEditing={unlock} returnKeyType="done" />
            {!!accessError && <Text style={styles.accessError}>{accessError}</Text>}
            <Pressable accessibilityRole="button" onPress={unlock} style={styles.accessButton}><Text style={styles.accessButtonText}>Verify Password</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={closeAccess} style={styles.accessCancel}><Text style={styles.accessCancelText}>Cancel</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  accessBackdrop: { flex: 1, justifyContent: 'center', padding: SIZES.space.lg, backgroundColor: 'rgba(0,0,0,0.6)' },
  accessCard: { alignSelf: 'center', width: '100%', maxWidth: 380, padding: SIZES.space.lg, borderRadius: SIZES.radius.card, backgroundColor: COLORS.accentTint },
  accessTitle: { ...FONTS.heading, color: COLORS.brand, textAlign: 'center', marginBottom: SIZES.space.lg },
  accessInput: { fontFamily: FONTS.family.regular, color: COLORS.contentPrimary, borderWidth: 1, borderColor: COLORS.brandAlpha32, borderRadius: SIZES.radius.md, padding: SIZES.space.md },
  accessError: { ...FONTS.bodySm, color: COLORS.dangerText, marginTop: SIZES.space.sm },
  accessButton: { backgroundColor: COLORS.brand, padding: SIZES.space.md, borderRadius: SIZES.radius.md, alignItems: 'center', marginTop: SIZES.space.lg },
  accessButtonText: { ...FONTS.action, color: COLORS.contentOnBrand },
  accessCancel: { padding: SIZES.space.md, alignItems: 'center' },
  accessCancelText: { ...FONTS.body, color: COLORS.contentSecondary },
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
    marginBottom: SIZES.space.xxxl,
    maxWidth: width * 0.82,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SIZES.space.sm,
    marginBottom: SIZES.space.xxxl,
  },
  chip: {
    backgroundColor: COLORS.whiteAlpha10,
    borderRadius: SIZES.radius.pill,
    paddingHorizontal: SIZES.space.lg,
    paddingVertical: SIZES.space.sm,
    borderWidth: 1,
    borderColor: COLORS.whiteAlpha20,
  },
  chipText: {
    fontFamily: FONTS.family.medium,
    fontSize: SIZES.text.sm,
    color: COLORS.contentOnBrand,
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

export default MaintenanceScreen;
