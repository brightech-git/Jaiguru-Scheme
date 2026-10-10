// Src/Screens/Auth/Login/hooks/useLogin.ts
// -----------------------------------------------------------------------------
// Encapsulates ALL login behaviour so the screen/components stay presentational:
//   • form state + validation (loginSchema)
//   • Remember-me persistence (AsyncStorage)
//   • real credential login (useAuth) + MPIN routing
//   • Google Sign-In (unchanged from the original screen)
//   • Guest entry + navigation helpers + toasts
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';

import useAuth from '../../../../api/hooks/Auth/useAuth';
import { saveAuthData, getMpinStatus } from '../../../../Utills/AsynchStorageHelper';
import { useToast } from '../../../../Components/Toast/Toast';
import {
  validateField,
  validateLogin,
  type LoginErrors,
  type LoginValues,
} from '../validation/loginSchema';

const REMEMBER_KEY = 'rememberedMobile';
const GOOGLE_WEB_CLIENT_ID =
  '985006297869-9mpqikboqvnesffmb9okfbuope80pg16.apps.googleusercontent.com';

type TouchedMap = Record<keyof LoginValues, boolean>;

export interface UseLogin {
  contactNumber: string;
  remember: boolean;
  errors: LoginErrors;
  loading: boolean;
  googleLoading: boolean;
  appleLoading: boolean;
  isBusy: boolean;
  onChangeContactNumber: (v: string) => void;
  onBlurField: (field: keyof LoginValues) => void;
  toggleRemember: () => void;
  submit: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  continueAsGuest: () => void;
  goToForgotPassword: () => void;
  goToRegister: () => void;
  Toast: React.FC;
}

export function useLogin(): UseLogin {
  const navigation = useNavigation<any>();
  const { login, loginWithGoogle, loginWithApple, loading, error, clearError } = useAuth();
  const { showToast, Toast } = useToast();

  const [contactNumber, setContactNumber] = useState('');
  const [remember, setRemember] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [touched, setTouched] = useState<TouchedMap>({ contactNumber: false });

  const isBusy = loading || googleLoading || appleLoading;

  // ---- One-time setup: Google + restore remembered mobile -------------------
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['profile', 'email'],
      offlineAccess: true,
    });

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(REMEMBER_KEY);
        if (saved) {
          setContactNumber(saved);
          setRemember(true);
        }
      } catch {
        /* non-fatal */
      }
    })();
  }, []);

  // Surface auth errors as toasts.
  useEffect(() => {
    if (error) showToast({ message: error, type: 'error' });
  }, [error, showToast]);

  // ---- Field change / blur --------------------------------------------------
  const revalidate = useCallback(
    (field: keyof LoginValues, value: string) => {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    },
    [],
  );

  const onChangeContactNumber = useCallback(
    (v: string) => {
      const digits = v.replace(/\D/g, '').slice(0, 10);
      setContactNumber(digits);
      if (touched.contactNumber) revalidate('contactNumber', digits);
    },
    [touched.contactNumber, revalidate],
  );

  const onBlurField = useCallback(
    (field: keyof LoginValues) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      revalidate(field, contactNumber);
    },
    [contactNumber, revalidate],
  );

  const toggleRemember = useCallback(() => setRemember((r) => !r), []);

  // ---- Post-auth routing ----------------------------------------------------
  const routeAfterAuth = useCallback(async (mpinSet?: string, userId?: string | number) => {
    // If username is not set, go to RegisterInfo first.
    if (userId) {
      try {
        const { userService } = await import('../../../../api/services/userService');
        const res: any = await userService.getDetails(userId);
        const name = String(res?.username || '').trim();
        if (!name) {
          navigation.replace('RegisterInfo', { userId, contactNumber: res?.contactNumber });
          return;
        }
      } catch { /* fall through to mpin routing */ }
    }
    // Prefer the live API value ("Y"/"N") over the stored flag.
    const fromApi = mpinSet === 'Y';
    const fromStorage = await getMpinStatus();
    if (fromApi || fromStorage) navigation.replace('MpinVerify');
    else navigation.replace('MpinCreate');
  }, [navigation]);

  // ---- Credential login -----------------------------------------------------
  const submit = useCallback(async () => {
    setTouched({ contactNumber: true });
    const result = validateLogin({ contactNumber });
    console.log('=== LOGIN VALIDATION RESULT ===', JSON.stringify(result, null, 2));
    setErrors(result.errors);
    if (!result.success) {
      showToast({ message: 'Please enter a valid contact number', type: 'warning' });
      return;
    }

    try {
      clearError();
      showToast({ message: 'Logging in securely...', type: 'info' });

      if (remember) await AsyncStorage.setItem(REMEMBER_KEY, contactNumber);
      else await AsyncStorage.removeItem(REMEMBER_KEY);

      const res: any = await login({ contactNumber });
      console.log('=== LOGIN PAYLOAD ===', { contactNumber, length: contactNumber.length });
      console.log('=== LOGIN RESPONSE ===', JSON.stringify(res, null, 2));

      if (res?.success !== false && res?.token) {
        await saveAuthData({ ...res, contactNumber: res.contactNumber || res.contact || contactNumber, loginType: 'NORMAL' });
        if (res.mpinSet === 'Y') await AsyncStorage.setItem('hasMpin', 'true');
        else await AsyncStorage.setItem('hasMpin', 'false');
        showToast({ message: 'Login successful!', type: 'success' });
        setTimeout(() => routeAfterAuth(res.mpinSet, res.id || res.userId), 1200);
      } else if (res?.message?.toLowerCase().includes('not registered')) {
        showToast({ message: 'You are not registered. Redirecting to Register...', type: 'warning' });
        setTimeout(() => navigation.navigate('Register'), 1500);
      } else {
        const msg = res?.message || res?.error || 'Invalid contact number';
        showToast({ message: msg, type: 'error' });
        setErrors((prev) => ({ ...prev, contactNumber: msg }));
      }
    } catch (err: any) {
      showToast({ message: err?.message || 'Network error. Please try again.', type: 'error' });
      setErrors((prev) => ({ ...prev, contactNumber: 'Network error. Please try again.' }));
    }
  }, [contactNumber, remember, login, clearError, showToast, routeAfterAuth]);

  // ---- Google Sign-In (unchanged logic) -------------------------------------
  const signInWithGoogle = useCallback(async () => {
    try {
      setGoogleLoading(true);
      clearError();
      showToast({ message: 'Connecting to Google...', type: 'info' });

      const hasPlay = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      if (!hasPlay) throw new Error('Google Play Services unavailable');

      await GoogleSignin.signOut().catch(() => {});

      // google-signin v13+ (this project uses 16.x) returns a SignInResponse:
      //   { type: 'success', data: { idToken, user, ... } }  or  { type: 'cancelled' }
      // Older versions returned the User object directly. Support both shapes.
      const signInResponse: any = await GoogleSignin.signIn();
      console.log('=== GOOGLE signIn() RAW RESPONSE ===', JSON.stringify(signInResponse, null, 2));

      if (signInResponse?.type === 'cancelled') {
        showToast({ message: 'Google sign-in cancelled', type: 'info' });
        return;
      }

      // v16 → data lives under `.data`; older → the response itself is the User.
      const data: any = signInResponse?.data ?? signInResponse;
      const googleUser = data?.user;
      console.log('=== GOOGLE USER PROFILE ===', JSON.stringify(googleUser, null, 2));

      // Prefer the idToken returned by signIn(); fall back to getTokens().
      let idToken: string | null = data?.idToken ?? null;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        console.log('=== GOOGLE getTokens() ===', JSON.stringify(tokens, null, 2));
        idToken = tokens?.idToken ?? null;
      }

      if (!idToken) {
        console.log('❌ No ID token from Google. Response was:', signInResponse);
        throw new Error('No ID token received from Google');
      }
      console.log('✅ Google ID token acquired (length):', idToken.length);

      showToast({ message: 'Authenticating with server...', type: 'info' });
      // Backend controller expects @RequestBody Map<String,String> and reads only
      // "idToken" (it extracts email/name/picture from the verified token itself).
      // Sending a nested object (e.g. userInfo) makes Spring reject the body as 400,
      // so we send a flat { idToken } payload.
      const res: any = await loginWithGoogle({ idToken });
      console.log('=== BACKEND /google-login RESPONSE ===', JSON.stringify(res, null, 2));

      if (res?.success !== false) {
        const { id, email, username, contactNumber, token } = res;
        const normalized = {
          ...res,
          id: id || res.userId,
          userId: id || res.userId,
          email,
          username,
          contactNumber: contactNumber || res.contact || '',
          token,
          loginType: 'GOOGLE',
        };
        await saveAuthData(normalized);
        showToast({ message: 'Login successful with Google!', type: 'success' });

        if (!normalized.contactNumber?.trim()) {
          navigation.navigate('GoogleContactVerification', {
            userId: id,
            email,
            username,
            token,
            picture: googleUser?.photo,
            isLogin: true,
          });
        } else {
          if (res.mpinSet === 'Y') await AsyncStorage.setItem('hasMpin', 'true');
          else await AsyncStorage.setItem('hasMpin', 'false');
          await routeAfterAuth(res.mpinSet);
        }
      } else {
        showToast({ message: res?.error || 'Google authentication failed', type: 'error' });
      }
    } catch (err: any) {
      console.log('=== GOOGLE SIGN-IN ERROR ===', {
        code: err?.code,
        message: err?.message,
        raw: err,
      });
      let msg = 'Google sign-in failed';
      switch (err?.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          msg = 'Google sign-in cancelled';
          break;
        case statusCodes.IN_PROGRESS:
          msg = 'Google sign-in already in progress';
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          msg = 'Google Play Services unavailable';
          break;
        default:
          msg = `Google sign-in failed: ${err?.message || 'Try again'}`;
      }
      showToast({ message: msg, type: 'error' });
    } finally {
      setGoogleLoading(false);
    }
  }, [clearError, loginWithGoogle, navigation, routeAfterAuth, showToast]);

  // ---- Apple Sign-In (iOS only) --------------------------------------------
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
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken, fullName, email } = credential;
      console.log('=== APPLE CREDENTIAL ===');
      console.log('identityToken length:', identityToken?.length);
      console.log('identityToken (first 100):', identityToken);
      console.log('email:', email);
      console.log('fullName:', JSON.stringify(fullName));
      console.log('user (sub):', credential.user);
      if (!identityToken) throw new Error('No identity token received from Apple');

      const payload = { idToken: identityToken };
      console.log('=== APPLE PAYLOAD TO BACKEND ===', JSON.stringify({ idToken: identityToken.substring(0, 80) + '...' }));
      showToast({ message: 'Authenticating with server...', type: 'info' });
      const res: any = await loginWithApple(payload);
      console.log('=== APPLE BACKEND RESPONSE ===', JSON.stringify(res, null, 2));

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
            userId: res.id,
            email: normalized.email,
            username: normalized.username,
            token: res.token,
            isLogin: true,
          });
        } else {
          if (res.mpinSet === 'Y') await AsyncStorage.setItem('hasMpin', 'true');
          else await AsyncStorage.setItem('hasMpin', 'false');
          await routeAfterAuth(res.mpinSet);
        }
      } else {
        showToast({ message: res?.error || 'Apple authentication failed', type: 'error' });
      }
    } catch (err: any) {
      if (err?.code === 'ERR_REQUEST_CANCELED') {
        showToast({ message: 'Apple sign-in cancelled', type: 'info' });
      } else {
        showToast({ message: `Apple sign-in failed: ${err?.message || 'Try again'}`, type: 'error' });
      }
    } finally {
      setAppleLoading(false);
    }
  }, [clearError, loginWithGoogle, navigation, routeAfterAuth, showToast]);

  // ---- Guest + navigation ---------------------------------------------------
  const continueAsGuest = useCallback(() => {
    navigation.replace('MainDrawer');
  }, [navigation]);

  const goToForgotPassword = useCallback(
    () => navigation.navigate('ForgotPassword', { mode: 'forgot' }),
    [navigation],
  );
  const goToRegister = useCallback(() => navigation.navigate('Register'), [navigation]);

  return useMemo(
    () => ({
      contactNumber,
      remember,
      errors,
      loading,
      googleLoading,
      appleLoading,
      isBusy,
      onChangeContactNumber,
      onBlurField,
      toggleRemember,
      submit,
      signInWithGoogle,
      signInWithApple,
      continueAsGuest,
      goToForgotPassword,
      goToRegister,
      Toast,
    }),
    [
      contactNumber,
      remember,
      errors,
      loading,
      googleLoading,
      appleLoading,
      isBusy,
      onChangeContactNumber,
      onBlurField,
      toggleRemember,
      submit,
      signInWithGoogle,
      signInWithApple,
      continueAsGuest,
      goToForgotPassword,
      goToRegister,
      Toast,
    ],
  );
}

export default useLogin;
