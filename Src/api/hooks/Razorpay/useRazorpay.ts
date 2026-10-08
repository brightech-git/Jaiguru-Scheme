// Src/api/hooks/Razorpay/useRazorpay.ts
//
// Webhook-based payment flow:
//   1. createOrder() — sends NEWJOIN + NMDATA (new member) or SCHEMEDETAILS
//      (installment) up front. The backend "parks" that payload against the
//      Razorpay order id and does NOT touch the real DB yet.
//   2. WebView checkout runs.
//   3. On success we call verify-payment. Whichever finishes first — this
//      call or Razorpay's own server-to-server webhook — is the one that
//      actually creates the member / inserts the installment (idempotent,
//      race-safe on the backend). Either way, by the time verify-payment
//      responds, the member/installment has been committed.
import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { razorpayService } from '../../services/razorpayService';
import { COLORS } from '../../../Utills/AppTheme';
import { CreateMemberPayload } from '../../../types/Member/Member';

export const PAYMENT_STEPS = {
  IDLE: 'idle',
  CREATING_ORDER: 'creating_order',
  PROCESSING_PAYMENT: 'processing_payment',
  VERIFYING: 'verifying',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

export type PaymentStep = (typeof PAYMENT_STEPS)[keyof typeof PAYMENT_STEPS];

export interface UserDetails {
  name?: string;
  email?: string;
  phone?: string;
}

/** Which payload create-order should park server-side for this payment. */
export interface OrderExtras {
  /** true = new member + first payment (sends NMDATA); false = installment on an existing member (sends SCHEMEDETAILS) */
  newJoin: boolean;
  nmData?: CreateMemberPayload;
  schemeDetails?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  message?: string;
  paymentId?: string;
  orderId?: string;
  /** Backend's stringified outcome of the parked payload once processed, e.g. "{status=Success, personalId=..., regNo=...}" */
  processResult?: string;
  data?: unknown;
  error?: unknown;
}

export const useRazorpayPayment = () => {
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>(PAYMENT_STEPS.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [razorpayOptions, setRazorpayOptions] = useState<Record<string, any> | null>(null);
  const resolveRef = useRef<((result: PaymentResult) => void) | null>(null);
  const currentOrderIdRef = useRef<string | null>(null);
  const verifyingRef = useRef(false);

  const finishPayment = useCallback((result: PaymentResult) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    currentOrderIdRef.current = null;
    verifyingRef.current = false;
    resolve?.(result);
  }, []);

  const resetState = useCallback(() => {
    if (resolveRef.current) return;
    setLoading(false);
    setPaymentStep(PAYMENT_STEPS.IDLE);
    setError(null);
    setWebViewVisible(false);
    setRazorpayOptions(null);
  }, []);

  const handlePaymentSuccess = useCallback(async (paymentData: any) => {
    if (!resolveRef.current || verifyingRef.current) return;
    verifyingRef.current = true;
    setWebViewVisible(false);

    if (paymentData?.failed) {
      console.log('[SCHEME JOIN] STEP 5 — Payment FAILED in checkout', paymentData.error);
      setPaymentStep(PAYMENT_STEPS.FAILED);
      const errMsg = paymentData.error?.description || 'Payment failed';
      setError(errMsg);
      setLoading(false);
      // A checkout error is not authoritative server payment status.
      finishPayment({ success: false, message: errMsg });
      return;
    }

    setPaymentStep(PAYMENT_STEPS.VERIFYING);

    try {
      if (!paymentData ||
          typeof paymentData.razorpay_payment_id !== 'string' || !paymentData.razorpay_payment_id ||
          typeof paymentData.razorpay_signature !== 'string' || !paymentData.razorpay_signature ||
          paymentData.razorpay_order_id !== currentOrderIdRef.current) {
        throw new Error('Invalid payment response. Check your payment status before paying again.');
      }
      const verifyPayload = {
        razorpay_order_id: currentOrderIdRef.current!,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      };
      const verifyResponse: any = await razorpayService.verifyPayment(verifyPayload);

      // Only explicit backend results can confirm payment. Checkout alone
      // does not prove capture; never infer success from message text.
      const alreadyHandledElsewhere =
        verifyResponse?.code === 'ALREADY_PAID' ||
        verifyResponse?.code === 'ALREADY_PROCESSED';

      const isVerifySuccess =
        verifyResponse?.success !== false && (
          verifyResponse?.success === true ||
          verifyResponse?.code === 'PAYMENT_SUCCESS' ||
          alreadyHandledElsewhere
        );

      if (!isVerifySuccess) throw new Error(verifyResponse?.message || 'Payment verification failed');

      console.log('[SCHEME JOIN] STEP 7 — Payment verified. Member created by backend.', { processResult: verifyResponse?.data?.processResult, viaAlreadyHandledPath: alreadyHandledElsewhere });
      setPaymentStep(PAYMENT_STEPS.SUCCESS);
      setLoading(false);
      const successResult: PaymentResult = {
        success: true,
        paymentId: paymentData.razorpay_payment_id,
        orderId: paymentData.razorpay_order_id,
        processResult: verifyResponse?.data?.processResult,
        data: verifyResponse,
      };
      finishPayment(successResult);
    } catch (err: any) {
      console.log('[SCHEME JOIN] STEP 6 ERROR — Payment verification failed', err?.message);
      setPaymentStep(PAYMENT_STEPS.FAILED);
      const message = `Payment confirmation could not be completed. Check your payment history before paying again. ${err?.message || ''}`.trim();
      setError(message);
      setLoading(false);
      finishPayment({ success: false, message, paymentId: paymentData?.razorpay_payment_id, error: err });
    }
  }, [finishPayment]);

  const handlePaymentDismiss = useCallback(() => {
    if (!resolveRef.current || verifyingRef.current) return;
    setWebViewVisible(false);
    setPaymentStep(PAYMENT_STEPS.IDLE);
    setLoading(false);
    // Closing checkout cannot cancel a payment already submitted to a bank.
    // Leave reconciliation to the backend and Razorpay webhooks.
    finishPayment({ success: false, message: 'Payment cancelled by user' });
  }, [finishPayment]);

  const startPayment = useCallback(
    (
      amount: number,
      userDetails: UserDetails,
      regNo: string | number,
      groupCode: string,
      orderExtras: OrderExtras
    ): Promise<PaymentResult> => {
      if (resolveRef.current) {
        return Promise.resolve({ success: false, message: 'A payment is already in progress' });
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        console.warn('[SCHEME JOIN] Invalid payment amount', { amount, regNo, groupCode });
        return Promise.resolve({ success: false, message: 'Invalid amount' });
      }
      if (!regNo || !groupCode) {
        console.warn('[SCHEME JOIN] Missing order registration details', { amount, regNo, groupCode, orderExtras });
        return Promise.resolve({ success: false, message: 'Missing registration details' });
      }
      if (orderExtras.newJoin && !orderExtras.nmData)
        return Promise.resolve({ success: false, message: 'Missing member registration details' });
      if (!orderExtras.newJoin && !orderExtras.schemeDetails)
        return Promise.resolve({ success: false, message: 'Missing installment details' });

      return new Promise((resolve) => {
        resolveRef.current = resolve;
        currentOrderIdRef.current = null;
        verifyingRef.current = false;
        setLoading(true);
        setPaymentStep(PAYMENT_STEPS.CREATING_ORDER);
        setError(null);

        (async () => {
          try {
            const orderResponse: any = await razorpayService.createOrder({
              amount,
              regNo,
              groupCode,
              newJoin: orderExtras.newJoin,
              nmData: orderExtras.nmData,
              schemeDetails: orderExtras.schemeDetails,
            });
            if (!orderResponse?.success) throw new Error(orderResponse?.message || 'Order creation failed');

            const backendOrder = orderResponse.data;
            if (typeof backendOrder?.order_id !== 'string' || !backendOrder.order_id ||
                typeof backendOrder.key !== 'string' || !backendOrder.key ||
                !Number.isSafeInteger(Number(backendOrder.amount)) || Number(backendOrder.amount) <= 0) {
              throw new Error('Invalid order response from backend');
            }

            console.log('[SCHEME JOIN] STEP 4 — Order created, launching Razorpay checkout', { order_id: backendOrder.order_id, amount: backendOrder.amount });
            currentOrderIdRef.current = backendOrder.order_id;
            setPaymentStep(PAYMENT_STEPS.PROCESSING_PAYMENT);

            const options = {
              description: 'Gold Scheme Payment',
              currency: backendOrder.currency || 'INR',
              key: backendOrder.key,
              amount: backendOrder.amount,
              order_id: backendOrder.order_id,
              name: 'Jai Guru Jewellers',
              prefill: {
                email: backendOrder.email || userDetails?.email || '',
                contact: backendOrder.contact || userDetails?.phone || '',
                name: backendOrder.name || userDetails?.name || '',
              },
              theme: { color: COLORS.contentBrand },
            };

            // Checkout is opened from inline WebView HTML, so Razorpay does
            // not return a redirect/short URL. Log the real script URL and
            // order used by that WebView for debugging.
            console.log('[RAZORPAY] WebView checkout launch', {
              checkoutScriptUrl: 'https://checkout.razorpay.com/v1/checkout.js',
              orderId: options.order_id,
              amount: options.amount,
              currency: options.currency,
            });
            setRazorpayOptions(options);
            // iOS cannot present a new modal while another is still dismissing.
            // A short delay lets the PaymentModal fully unmount first.
            setTimeout(() => {
              if (resolveRef.current && currentOrderIdRef.current === backendOrder.order_id) setWebViewVisible(true);
            }, Platform.OS === 'ios' ? 400 : 0);
          } catch (err: any) {
            setPaymentStep(PAYMENT_STEPS.FAILED);
            setError(err?.message);
            setLoading(false);
            finishPayment({ success: false, message: err?.message, error: err });
          }
        })();
      });
    },
    [finishPayment]
  );

  return {
    loading,
    paymentStep,
    error,
    startPayment,
    resetState,
    PAYMENT_STEPS,
    webViewVisible,
    razorpayOptions,
    handlePaymentSuccess,
    handlePaymentDismiss,
  };
};
