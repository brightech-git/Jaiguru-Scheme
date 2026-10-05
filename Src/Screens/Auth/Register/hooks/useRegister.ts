import { useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { getHash } from '../../../../Utills/otpVerifyShim';

import useAuth from '../../../../api/hooks/Auth/useAuth';
import { useToast } from '../../../../Components/Toast/Toast';
import {
  REGISTER_DEFAULTS,
  registerSchema,
  type RegisterFormValues,
} from '../validation/registerSchema';

const DEFAULT_HASH = 'd4riq2SwBaq';

export function useRegister() {
  const navigation = useNavigation<any>();
  const { signUp, loading, clearError } = useAuth();
  const { showToast, Toast } = useToast();
  const hashRef = useRef<string>(DEFAULT_HASH);

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

  return {
    form,
    loading,
    submit,
    goToLogin,
    Toast,
  };
}

export type UseRegister = ReturnType<typeof useRegister>;
export default useRegister;
