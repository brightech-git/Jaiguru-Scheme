import { Text } from '../../../../Components/Typography/FontText';
// Src/Screens/Auth/Login/components/LoginForm.tsx
// -----------------------------------------------------------------------------
// Glassmorphism login card: mobile + password inputs, show/hide, remember-me,
// forgot password, and the primary "Login Securely" button.
// Purely presentational — all state comes from the useLogin hook. Uses AppTheme.
// -----------------------------------------------------------------------------

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import theme from '../../../../Utills/AppTheme';
import type { LoginErrors, LoginValues } from '../validation/loginSchema';
import { LOGIN_CONSTRAINTS } from '../validation/loginSchema';
import LuxuryInput from './LuxuryInput';
import LoginButton from './LoginButton';

const { COLORS, SIZES, FONTS, ELEVATION, STYLES } = theme;

export interface LoginFormProps {
  contactNumber: string;
  remember: boolean;
  errors: LoginErrors;
  loading: boolean;
  isBusy: boolean;
  onChangeContactNumber: (v: string) => void;
  onBlurField: (field: keyof LoginValues) => void;
  toggleRemember: () => void;
  onSubmit: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  contactNumber,
  remember,
  errors,
  loading,
  isBusy,
  onChangeContactNumber,
  onBlurField,
  toggleRemember,
  onSubmit,
}) => {
  return (
    <View style={styles.cardShadow}>
      <BlurView intensity={30} tint="light" style={styles.card}>
        <LuxuryInput
          icon="cellphone"
          value={contactNumber}
          onChangeText={onChangeContactNumber}
          onBlur={() => onBlurField('contactNumber')}
          placeholder="Contact Number"
          keyboardType="number-pad"
          textContentType="telephoneNumber"
          maxLength={LOGIN_CONSTRAINTS.mobileLength}
          editable={!isBusy}
          error={errors.contactNumber}
          accessibilityLabel="Contact number"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />

        {/* <LuxuryInput
          icon="lock-outline"
          value={password}
          onChangeText={onChangePassword}
          onBlur={() => onBlurField('password')}
          placeholder="Password"
          secureTextEntry={!showPassword}
          textContentType="password"
          editable={!isBusy}
          error={errors.password}
          accessibilityLabel="Password"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          trailingIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
          onTrailingPress={toggleShowPassword}
          trailingAccessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        /> */}

        <View style={[ styles.optionsRow]}>
          <Pressable
            onPress={toggleRemember}
            hitSlop={8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: remember }}
            accessibilityLabel="Remember me"
            style={STYLES.row}
          >
            <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
              {remember && <MaterialCommunityIcons name="check" size={SIZES.icon.xs} color={COLORS.contentOnBrand} />}
            </View>
            <Text style={styles.rememberText}>Remember Me</Text>
          </Pressable>

          {/* <Pressable onPress={onForgotPassword} hitSlop={8} disabled={isBusy} accessibilityRole="button">
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable> */}
        </View>

        <View style={styles.buttonWrap}>
          <LoginButton
            label="Login Securely"
            
            onPress={onSubmit}
            loading={loading}
            disabled={isBusy}
            icon="shield-check"
            accessibilityHint="Signs you in to your Digital Gold account"
          />
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  cardShadow: {
    borderRadius: SIZES.radius.xxl,
    ...ELEVATION.floating,
    shadowColor: COLORS.shadowAccent,
  },
  card: {
    borderRadius: SIZES.radius.xxl,
    overflow: 'hidden',
    padding: SIZES.space.xxl,
    backgroundColor: COLORS.whiteAlpha70,
    borderWidth: 1,
    borderColor: COLORS.brandAlpha32,
  },
  optionsRow: {
    marginTop: SIZES.space.xs,
    marginBottom: SIZES.space.sm,
    alignSelf: 'flex-end',
    // justifyContent: 'space-between',
    // flexDirection: 'row',
  },
  checkbox: {
    width: SIZES.icon.md,
    height: SIZES.icon.md,
    borderRadius: SIZES.radius.xs,
    borderWidth: 1.5,
    borderColor: COLORS.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.space.sm,
    backgroundColor: COLORS.surface,
  },
  checkboxChecked: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.borderBrand,
  },
  rememberText: {
    fontFamily: FONTS.family.medium,
    fontSize: SIZES.text.md,
    color: COLORS.contentSecondary,
  },
  forgotText: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.md,
    color: COLORS.contentBrand,
  },
  buttonWrap: {
    marginTop: SIZES.space.lg,
  },
});

export default React.memo(LoginForm);
