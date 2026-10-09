import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

export interface NativePaymentData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
interface NativeCheckout {
  open(options: Record<string, unknown>): Promise<NativePaymentData>;
}

export function parseCheckoutError(value: any) {
  let nested = value?.error;
  const raw = value?.description ?? value?.message;
  if (typeof raw === 'string') {
    try { nested = JSON.parse(raw)?.error || nested; } catch { /* Plain SDK descriptions are also valid. */ }
  }
  const reason = String(nested?.reason || value?.reason || '').toLowerCase();
  const cancelled = Number(value?.code) === 2 ||
    ['payment_cancelled', 'payment_canceled', 'user_cancelled', 'user_canceled'].includes(reason);
  const description = nested?.description ?? raw;
  const readable = typeof description === 'string' && description.trim() &&
    !['undefined', 'null'].includes(description.trim().toLowerCase()) && !/^[\[{]/.test(description.trim());
  return {
    cancelled,
    uncertain: !cancelled && !readable,
    description: readable ? description : 'Checkout closed without confirming the payment status. If money was debited, check your payment history before paying again.',
  };
}

export function getNativeRazorpay(): NativeCheckout {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    throw new Error('Razorpay payments are available in the Android and iOS apps.');
  }
  if (!NativeModules.RNRazorpayCheckout && !TurboModuleRegistry.get('RNRazorpayCheckout')) {
    throw new Error('Razorpay SDK is unavailable. Install a rebuilt app to make payments.');
  }
  // Load only after checking native availability so older builds can still open.
  return require('react-native-razorpay').default as NativeCheckout;
}
