// Src/api/services/authService.ts
import { callApi } from '../apiClient';
import { AUTH, USER } from '../endpoints';
import {
  AuthApiResponse,
  RegisterPayload,
  LoginPayload,
  VerifyOtpPayload,
} from '../../types/auth';

export const authService = {
  /** POST /user/register */
  register: (payload: RegisterPayload) =>
    callApi<RegisterPayload, AuthApiResponse>({
      method: 'post',
      url: AUTH.REGISTER,
      data: payload,
    }),

  /** POST /user/verify-otp (query params, matches existing RegisterService.js) */
  verifyOtp: (payload: VerifyOtpPayload) =>
    callApi<null, AuthApiResponse>({
      method: 'post',
      url: AUTH.VERIFY_OTP,
      params: payload,
    }),

  /** POST /user/login */
  login: (payload: LoginPayload) =>
    callApi<LoginPayload, AuthApiResponse>({
      method: 'post',
      url: AUTH.LOGIN,
      data: payload,
    }),

  /** POST /user/forgot-password */
  forgotPassword: (payload: { contactNumber: string }) =>
    callApi<{ contactNumber: string }, AuthApiResponse>({
      method: 'post',
      url: AUTH.FORGOT_PASSWORD,
      data: payload,
    }),

  /** POST /user/verify-otp?contactNumber&otp&newPassword — resets password via the same OTP endpoint */
  resetPassword: (payload: { contactNumber: string; otp: string; newPassword: string }) =>
    callApi<null, AuthApiResponse>({
      method: 'post',
      url: AUTH.RESET_PASSWORD,
      params: payload,
    }),

  /** PATCH /user/{userId}/update */
  updateUserInfo: (userId: number | string, payload: Record<string, unknown>) =>
    callApi<Record<string, unknown>, AuthApiResponse>({
      method: 'patch',
      url: USER.UPDATE(userId),
      data: payload,
    }),

  /** POST /google-login */
  googleLogin: (payload: Record<string, unknown>) =>
    callApi<Record<string, unknown>, AuthApiResponse>({
      method: 'post',
      url: AUTH.GOOGLE_LOGIN,
      data: payload,
    }),

  /** POST /apple-login */
  appleLogin: (payload: Record<string, unknown>) =>
    callApi<Record<string, unknown>, AuthApiResponse>({
      method: 'post',
      url: AUTH.APPLE_LOGIN,
      data: payload,
    }),

  /** POST /request-google-contact-update?userId&newContactNumber&hashKey */
  requestGoogleContactOtp: (payload: { userId: string | number; newContactNumber: string; hashKey?: string }) =>
    callApi<null, AuthApiResponse>({
      method: 'post',
      url: AUTH.GOOGLE_CONTACT_UPDATE,
      params: {
        userId: String(payload.userId),
        newContactNumber: payload.newContactNumber,
        ...(payload.hashKey ? { hashKey: payload.hashKey } : {}),
      },
    }),

  /** POST /verify-google-contact-otp?newContactNumber&otp&userId */
  verifyGoogleContactOtp: (payload: { newContactNumber: string; otp: string; userId?: string | number }) =>
    callApi<null, AuthApiResponse>({
      method: 'post',
      url: AUTH.GOOGLE_CONTACT_VERIFY_OTP,
      params: {
        newContactNumber: payload.newContactNumber,
        otp: payload.otp,
        ...(payload.userId ? { userId: payload.userId } : {}),
      },
    }),
};
