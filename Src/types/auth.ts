// Src/types/auth.ts
//
// The backend returns slightly different shapes for normal login/register,
// OTP verification, and Google login — all normalized by
// Src/Utills/AsynchStorageHelper.js's normalizeAuthResponse(). This type
// covers the union of fields actually read across the app so far.

export interface AuthApiResponse {
  token?: string;
  accessToken?: string;
  id?: number | string;
  userId?: number | string;
  username?: string;
  name?: string;
  email?: string;
  contactNumber?: string;
  mobileNumber?: string;
  phone?: string;
  referralCode?: string;
  referralLink?: string;
  playStoreLink?: string;
  socialMedia?: string;
  picture?: string;
  avatar?: string;
  used_referral_code?: string;
  errorMessage?: string;
  data?: Partial<AuthApiResponse>;
}

export interface RegisterPayload {
  username: string;
  email?: string;
  contactNumber: string;
  referralCode?: string;
  [key: string]: unknown;
}

export interface LoginPayload {
  contactNumber: string;
}

export interface VerifyOtpPayload {
  username?: string;
  email?: string;
  contactNumber?: string;
  otp: string;
  newPassword?: string;
}
