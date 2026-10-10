import { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHash } from '../../../../Utills/otpVerifyShim';

import useAuth from '../../../../api/hooks/Auth/useAuth';
import { saveAuthData, getMpinStatus } from '../../../../Utills/AsynchStorageHelper';
import { useToast } from '../../../../Components/Toast/Toast';
import {
  REGISTER_DEFAULTS,
  registerSchema,
  type RegisterFormValues,
} from '../validation/registerSchema';

const GOOGLE_WEB_CLIENT_ID = '985006297869-9mpqikboqvnesffmb9okfbuope80pg16.apps.googleusercontent.com';

const DEFAULT_HASH = 'd4riq2SwBaq';

export function useRegister() {
  const navigation = useNavigation<any>();
  const { signUp, loginWithGoogle, loginWithApple, loading, clearError } = useAuth();
  const { showToast, Toast } = useToast();
  const hashRef = useRef<string>(DEFAULT_HASH);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: REGISTER_DEFAULTS,
    mode: 'onTouched',
  });

  const onValid = useCallback(
    async (values: RegisterFormValues) => {
      try {
        clearError();

        try {
          const hash = await getHash();
          if (hash?.[0]) hashRef.current = hash[0];
        } catch {}

        const payload = {
          contactNumber: values.contactNumber.trim(),
          hashKey: hashRef.current,
        };

        const result: any = await signUp(payload);
        console.log('=== REGISTER RESPONSE ===', JSON.stringify(result, null, 2));

        const otpSent =
          result?.errorMessage?.includes('OTP sent') ||
          result?.message?.includes('OTP sent') ||
          result?.otp ||
          result?.whatsappLink;

        if (otpSent) {
          showToast({ message: 'OTP sent to your contact number', type: 'success', duration: 2500 });
          setTimeout(() => {
            navigation.navigate('VerifyOTP', {
              mobileNumber: values.contactNumber.trim(),
              registrationData: payload,
              otpType: 'normal',
              onVerified: (res: any) => {
                navigation.replace('RegisterInfo', {
                  userId: res?.id || res?.userId,
                  contactNumber: values.contactNumber.trim(),
                });
              },
            });
            form.reset(REGISTER_DEFAULTS);
          }, 1400);
        } else {
          const msg = result?.message || result?.errorMessage || 'Registration failed. Please try again.';
          showToast({ message: msg, type: 'error', duration: 4000 });
        }
      } catch (err: any) {
        showToast({ message: err?.message || 'Something went wrong. Please try again.', type: 'error', duration: 4000 });
      }
    },
    [clearError, signUp, showToast, navigation, form],
  );

  const submit = form.handleSubmit(onValid);
  const goToLogin = useCallback(() => navigation.navigate('Login'), [navigation]);

  const routeAfterAuth = useCallback(async (mpinSet?: string) => {
    const fromApi = mpinSet === 'Y';
    const fromStorage = await getMpinStatus();
    if (fromApi || fromStorage) navigation.replace('MpinVerify');
    else navigation.replace('MpinCreate');
  }, [navigation]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setGoogleLoading(true);
      clearError();
      showToast({ message: 'Connecting to Google...', type: 'info' });

      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, scopes: ['profile', 'email'], offlineAccess: true });
      const hasPlay = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      if (!hasPlay) throw new Error('Google Play Services unavailable');
      await GoogleSignin.signOut().catch(() => {});

      const signInResponse: any = await GoogleSignin.signIn();
      if (signInResponse?.type === 'cancelled') {
        showToast({ message: 'Google sign-in cancelled', type: 'info' });
        return;
      }

      const data: any = signInResponse?.data ?? signInResponse;
      let idToken: string | null = data?.idToken ?? null;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens?.idToken ?? null;
      }
      if (!idToken) throw new Error('No ID token received from Google');

      showToast({ message: 'Authenticating with server...', type: 'info' });
      const res: any = await loginWithGoogle({ idToken });

      if (res?.success !== false) {
        const normalized = {
          ...res,
          id: res.id || res.userId,
          userId: res.id || res.userId,
          contactNumber: res.contactNumber || res.contact || '',
          token: res.token,
          loginType: 'GOOGLE',
        };
        await saveAuthData(normalized);
        showToast({ message: 'Login successful with Google!', type: 'success' });
        if (!normalized.contactNumber?.trim()) {
          navigation.navigate('GoogleContactVerification', {
            userId: res.id, email: res.email, username: res.username, token: res.token,
            picture: data?.user?.photo, isLogin: false,
          });
        } else {
          await AsyncStorage.setItem('hasMpin', res.mpinSet === 'Y' ? 'true' : 'false');
          await routeAfterAuth(res.mpinSet);
        }
      } else {
        showToast({ message: res?.error || 'Google authentication failed', type: 'error' });
      }
    } catch (err: any) {
      let msg = 'Google sign-in failed';
      if (err?.code === statusCodes.SIGN_IN_CANCELLED) msg = 'Google sign-in cancelled';
      else if (err?.code === statusCodes.IN_PROGRESS) msg = 'Google sign-in already in progress';
      else if (err?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) msg = 'Google Play Services unavailable';
      else msg = `Google sign-in failed: ${err?.message || 'Try again'}`;
      showToast({ message: msg, type: 'error' });
    } finally {
      setGoogleLoading(false);
    }
  }, [clearError, loginWithGoogle, navigation, routeAfterAuth, showToast]);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    try {
      setAppleLoading(true);
      clearError();
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        showToast({ message: 'Apple Sign-In is not available on this device.', type: 'warning' });
        return;
      }
      showToast({ message: 'Connecting to Apple...', type: 'info' });
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      const { identityToken, fullName, email } = credential;
      console.log('=== APPLE IDENTITY TOKEN ===');
      console.log(identityToken);
      if (!identityToken) throw new Error('No identity token received from Apple');

      showToast({ message: 'Authenticating with server...', type: 'info' });
      const res: any = await loginWithApple({ idToken: identityToken });

      if (res?.success !== false) {
        const normalized = {
          ...res,
          id: res.id || res.userId,
          userId: res.id || res.userId,
          email: res.email || email,
          username: res.username || `${fullName?.givenName ?? ''} ${fullName?.familyName ?? ''}`.trim(),
          contactNumber: res.contactNumber || res.contact || '',
          token: res.token,
          loginType: 'APPLE',
        };
        await saveAuthData(normalized);
        showToast({ message: 'Login successful with Apple!', type: 'success' });
        if (!normalized.contactNumber?.trim()) {
          navigation.navigate('GoogleContactVerification', {
            userId: res.id, email: normalized.email, username: normalized.username, token: res.token, isLogin: false,
          });
        } else {
          await AsyncStorage.setItem('hasMpin', res.mpinSet === 'Y' ? 'true' : 'false');
          await routeAfterAuth(res.mpinSet);
        }
      } else {
        showToast({ message: res?.error || 'Apple authentication failed', type: 'error' });
      }
    } catch (err: any) {
      if (err?.code === 'ERR_REQUEST_CANCELED') showToast({ message: 'Apple sign-in cancelled', type: 'info' });
      else showToast({ message: `Apple sign-in failed: ${err?.message || 'Try again'}`, type: 'error' });
    } finally {
      setAppleLoading(false);
    }
  }, [clearError, loginWithApple, navigation, routeAfterAuth, showToast]);

  return {
    form,
    loading,
    googleLoading,
    appleLoading,
    submit,
    goToLogin,
    signInWithGoogle,
    signInWithApple,
    Toast,
  };
}

export type UseRegister = ReturnType<typeof useRegister>;
export default useRegister;
