import { Text } from '../../../Components/Typography/FontText';
// Src/Screens/Auth/ForgotMpin/ForgotMpin.tsx
// -----------------------------------------------------------------------------
// Premium Forgot-MPIN screen (champagne theme). Shows the masked registered
// mobile and sends a reset OTP. Logic preserved; UI via MpinScaffold + gold CTA.
// -----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMpin } from '../../../api/hooks/Mpin/useMpin';
import theme from '../../../Utills/AppTheme';
import { getUserData } from '../../../Utills/AsynchStorageHelper';
import MpinScaffold from '../Mpin/MpinScaffold';
import LoginButton from '../Login/components/LoginButton';

const { COLORS, SIZES, FONTS } = theme;

const ForgotMpinScreen = () => {
  const navigation = useNavigation<any>();
  const { sendForgotOtp, loading } = useMpin();

  const [userMobile, setUserMobile] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    loadUserMobile();
  }, []);

  const loadUserMobile = async () => {
    try {
      setIsLoadingUser(true);
      const userData: any = await getUserData();
      if (userData) {
        const mobile = userData.contactNumber || userData.mobileNumber || userData.phone || userData.mobile;
        setUserMobile(mobile || '');
      }
    } catch (error) {
      console.error('Error loading user mobile:', error);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const formatMobileNumber = (number: string) => {
    if (!number) return '';
    const strNumber = String(number);
    if (strNumber.length >= 10) return `•••• •••• ${strNumber.slice(-4)}`;
    if (strNumber.length >= 4) return `••••${strNumber.slice(-4)}`;
    return 'registered number';
  };

  const handleSendOtp = async () => {
    try {
      const res: any = await sendForgotOtp();
      Alert.alert('Success', res.message);
      navigation.navigate('VerifyForgotMpin');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <MpinScaffold
      headerTitle="Forgot MPIN"
      icon="shield-key-outline"
      heading="Forgot MPIN?"
      subtitle="We'll send a verification code to your registered mobile number to reset your MPIN."
    >
      {isLoadingUser ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="small" color={COLORS.contentBrand} />
          <Text style={styles.loadingText}>Loading your details…</Text>
        </View>
      ) : userMobile ? (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="cellphone" size={SIZES.icon.sm} color={COLORS.contentBrand} />
            <Text style={styles.infoTitle}>Registered Mobile Number</Text>
          </View>
          <Text style={styles.mobileNumber}>{formatMobileNumber(userMobile)}</Text>
          <View style={styles.divider} />
          <Text style={styles.infoText}>
            We'll send a 6-digit verification code to this number. It expires in 10 minutes.
          </Text>
        </View>
      ) : (
        <View style={styles.warningCard}>
          <MaterialCommunityIcons name="alert-circle-outline" size={SIZES.icon.lg} color={COLORS.warning} />
          <Text style={styles.warningTitle}>Mobile Number Not Found</Text>
          <Text style={styles.warningText}>
            We couldn't find your registered mobile number. Please contact support for assistance.
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <LoginButton
          label={userMobile ? 'Send OTP' : 'Contact Support'}
          onPress={handleSendOtp}
          loading={loading}
          disabled={loading || !userMobile}
          icon="message-badge-outline"
        />
      </View>

      <Text style={styles.disclaimer}>
        By continuing, you agree to receive an OTP via SMS. Standard message and data rates may apply.
      </Text>
    </MpinScaffold>
  );
};

export default ForgotMpinScreen;

const styles = StyleSheet.create({
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.space.lg,
  },
  loadingText: {
    fontFamily: FONTS.family.medium,
    fontSize: SIZES.text.sm,
    color: COLORS.contentSecondary,
    marginLeft: SIZES.space.sm,
  },
  infoCard: {
    backgroundColor: COLORS.whiteAlpha80,
    borderRadius: SIZES.radius.xl,
    padding: SIZES.space.lg,
    borderWidth: 1,
    borderColor: COLORS.brandAlpha32,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.space.sm,
  },
  infoTitle: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.md,
    color: COLORS.contentPrimary,
    marginLeft: SIZES.space.sm,
  },
  mobileNumber: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.xxl,
    color: COLORS.contentBrand,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.accentSubtle,
    marginVertical: SIZES.space.lg,
  },
  infoText: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.sm,
    lineHeight: SIZES.text.sm * 1.5,
    color: COLORS.contentSecondary,
  },
  warningCard: {
    alignItems: 'center',
    backgroundColor: COLORS.whiteAlpha80,
    borderRadius: SIZES.radius.xl,
    padding: SIZES.space.lg,
    borderWidth: 1,
    borderColor: `${COLORS.warning}40`,
  },
  warningTitle: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.lg,
    color: COLORS.contentPrimary,
    marginTop: SIZES.space.sm,
  },
  warningText: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.sm,
    lineHeight: SIZES.text.sm * 1.5,
    color: COLORS.contentSecondary,
    textAlign: 'center',
    marginTop: SIZES.space.xs,
  },
  footer: { marginTop: SIZES.space.xxxl },
  disclaimer: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.xxs,
    lineHeight: SIZES.text.xxs * 1.5,
    color: COLORS.contentMuted,
    textAlign: 'center',
    marginTop: SIZES.space.xxl,
  },
});
