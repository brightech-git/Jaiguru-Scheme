import { Text } from '../../../Components/Typography/FontText';
import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import useAuth from '../../../api/hooks/Auth/useAuth';
import CommonHeader from '../../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../../Components/PremiumBackground/PremiumBackground';
import theme from '../../../Utills/AppTheme';
import { AppInput, AppButton } from '../../../Components/ui/appcomponents';

const { COLORS, SIZES, FONTS, ELEVATION } = theme;

interface Props {
  navigation: any;
}

const ForgotPasswordScreen = ({ navigation }: Props) => {
  const [contactNumber, setContactNumber] = useState('');
  const { sendForgotPassword, loading } = useAuth();

  const handleSendOtp = async () => {
    if (!contactNumber) {
      Alert.alert('Error', 'Please enter your contact number');
      return;
    }

    if (contactNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit contact number');
      return;
    }

    const res: any = await sendForgotPassword({ contactNumber });

    if (!res?.error) {
      Alert.alert('Success', 'OTP sent successfully to your mobile number');
      navigation.navigate('ForgotVerifyOTP', { contactNumber });
    } else {
      Alert.alert('Error', res.error);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <PremiumBackground />
      <CommonHeader title="Forgot Password" transparent borderBottom={false} shadow={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        {/* <View style={styles.goldAccent} /> */}

        <View style={styles.iconContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.iconText}>🔐</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Don't worry! Enter your registered mobile number and we'll send you an OTP to reset your password.
          </Text>

          <AppInput
            label="Mobile Number"
            value={contactNumber}
            onChangeText={(text) => setContactNumber(text.replace(/[^0-9]/g, ''))}
            placeholder="Enter 10-digit number"
            keyboardType="number-pad"
            maxLength={10}
            leftIcon="call-outline"
            error={contactNumber.length > 0 && contactNumber.length < 10 ? 'Please enter a valid 10-digit number' : undefined}
            containerStyle={styles.inputWrapper}
          />

          <AppButton
            label="Send OTP"
            onPress={handleSendOtp}
            disabled={loading || !contactNumber || contactNumber.length < 10}
            loading={loading}
            variant="primary"
            size="lg"
            style={styles.button}
          />

          <TouchableOpacity style={styles.backToLogin} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surfacePage },
  scrollContent: { flexGrow: 1 },
  goldAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: SIZES.screen.width * 0.4,
    height: SIZES.screen.width * 0.4,
    backgroundColor: COLORS.brandAlpha08,
    borderBottomLeftRadius: SIZES.radius.xxl,
    zIndex: 0,
  },
  iconContainer: { alignItems: 'center', marginTop: SIZES.space.xxxl, marginBottom: SIZES.space.lg, zIndex: 1 },
  iconWrapper: {
    width: SIZES.icon.avatarLg,
    height: SIZES.icon.avatarLg,
    borderRadius: SIZES.radius.xxl,
    backgroundColor: COLORS.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    ...ELEVATION.brandGlow,
  },
  iconText: { fontSize: SIZES.icon.avatar },
  content: { flex: 1, paddingHorizontal: SIZES.space.xl, paddingTop: SIZES.space.md },
  title: { ...FONTS.display, color: COLORS.contentBrand, marginBottom: SIZES.space.sm, textAlign: 'center' },
  subtitle: { ...FONTS.bodySm, color: COLORS.contentSecondary, textAlign: 'center', marginBottom: SIZES.space.xl, paddingHorizontal: SIZES.space.md },
  inputWrapper: { marginBottom: SIZES.space.xl },
  button: { marginTop: SIZES.space.sm },
  backToLogin: { marginTop: SIZES.space.xl, alignItems: 'center', padding: SIZES.space.md },
  backToLoginText: { ...FONTS.bodyEmphasis, color: COLORS.contentBrand, textDecorationLine: 'underline' },
});

export default ForgotPasswordScreen;
