// Src/api/endpoints.ts
//
// Centralized endpoint paths, grouped by domain — mirrors the structure of
// the Dhanapal-DigiGold-New reference project's src/api/endpoints.ts.
// Every path below was extracted directly from the existing Jaiguru
// Src/Services/*.js files (not guessed), so this is a faithful map of what
// the backend actually exposes today. All paths are relative to
// axiosInstance's baseURL (Src/Config/BaseUrl.js -> API_BASE_URL).

export const ONBOARDING = {
  BANNERS: '/schemebanner/all',
};

export const AUTH = {
  REGISTER: '/user/register',
  VERIFY_OTP: '/user/verify-otp',
  LOGIN: '/user/login',
  FORGOT_PASSWORD: '/user/forgot-password',
  // Reuses VERIFY_OTP with a newPassword param — see RegisterService.js's
  // resetPassword(). Kept as its own key for clarity at call sites.
  RESET_PASSWORD: '/user/verify-otp',
  GOOGLE_LOGIN: '/google-login',
  APPLE_LOGIN: '/apple-login',
  GOOGLE_CONTACT_UPDATE: '/request-google-contact-update',
  GOOGLE_CONTACT_VERIFY_OTP: '/verify-google-contact-otp',
};

export const MPIN = {
  CREATE: '/mpin/create',
  VERIFY: '/mpin/verify',
  RESET_WITH_OLD: '/mpin/resetMpin',
  RESET_DIRECT: '/mpin/reset',
  FORGOT_SEND_OTP: '/mpin/forgot/send-otp',
  FORGOT_VERIFY: '/mpin/forgot/verify',
};

export const DEVICE = {
  REGISTER: '/device/register',
};

export const SCHEME_SLIDER = {
  ALL: '/schemeslider/all',
};

export const SCHEMES = {
  // Full scheme catalog (SchemeNameService.js)
  ALL: '/member/scheme',
  // Schemes/amount options for a specific scheme id (SchemeAmountService.js)
  BY_SCHEME_ID: (schemeId: number | string) => `/member/schemeid?schemeId=${schemeId}`,
};

// NOTE: /member/create and /account/insert are disabled server-side (the
// backend controllers have them commented out). New members and scheme
// installments are now created exclusively via the Razorpay webhook flow —
// see RAZORPAY.CREATE_ORDER (NMDATA / SCHEMEDETAILS parked against the
// order, committed to the real DB once payment is verified). Do not add
// direct calls to those two paths back in.

export const ACCOUNT = {
  PHONE_DETAILS: (phoneNo: string) => `/account/phone_details?phoneNo=${phoneNo}`,
  TODAY_RATE: '/account/todayrate',
  TRANSACTION_TYPES: '/account/getTranType',
};

export const MEMBER = {
  KYC_STATUS: (personalId: string | number) => `/member/kyc-status/${encodeURIComponent(String(personalId))}`,
  DETAILS: (personalId: string | number) => `/member/details/${encodeURIComponent(String(personalId).toLowerCase())}`,
};

export const COMPANY = {
  ALL: '/company/all',
};

export const APP_CONTENT = {
  BY_ID: (contentId: string) => `/app-content/${encodeURIComponent(contentId)}`,
};

export const SOFT_CONTROL = {
  KYC_UPDATION: '/soft-control/kyc-updation',
};

export const LOGIN_CHECK = {
  REGISTER: '/logincheck/register',
  LIST: (date: string) => `/logincheck/get?date=${date}`,
};

export const RAZORPAY = {
  CREATE_ORDER: '/razorpay/create-order',
  VERIFY_PAYMENT: '/razorpay/verify-payment',
  PAYMENT_FAILED: '/razorpay/payment-failed',
  PAYMENT_BY_RECEIPT: (receipt: string) => `/razorpay/payment/receipt/${receipt}`,
};

export const USER = {
  DELETE: (userId: number | string) => `/user/delete/${userId}`,
  UPDATE: (userId: number | string) => `/${userId}/update`,
};

export const NOTIFICATIONS = {
  GET_USER: (userId: number | string) => `/notifications/user/${userId}`,
  UNREAD_COUNT: (userId: number | string) => `/notifications/user/${userId}/unread-count`,
  MARK_ALL_READ: (userId: number | string) => `/notifications/read/all/${userId}`,
  MARK_READ: (notificationId: number | string, userId: number | string) =>
    `/notifications/read/${notificationId}/user/${userId}`,
  DELETE_ONE: (notificationId: number | string) => `/notifications/notification/${notificationId}`,
  DELETE_BY_USER: (userId: number | string) => `/notifications/user/${userId}`,
};

export const EMPLOYEES = {
  SEARCH: (empId: string) => `/employees?empId=${encodeURIComponent(empId)}`,
};
