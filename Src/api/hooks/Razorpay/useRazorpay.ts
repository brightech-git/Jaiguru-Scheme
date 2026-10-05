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

  const resetState = useCallback(() => {
    setLoading(false);
    setPaymentStep(PAYMENT_STEPS.IDLE);
    setError(null);
    setWebViewVisible(false);
    setRazorpayOptions(null);
  }, []);

  const handlePaymentSuccess = useCallback(async (paymentData: any) => {
    setWebViewVisible(false);

    if (paymentData?.failed) {
      console.log('[SCHEME JOIN] STEP 5 — Payment FAILED in checkout', paymentData.error);
      setPaymentStep(PAYMENT_STEPS.FAILED);
      const errMsg = paymentData.error?.description || 'Payment failed';
      setError(errMsg);
      setLoading(false);
      if (currentOrderIdRef.current) {
        razorpayService.markFailed(currentOrderIdRef.current).catch(() => {});
      }
      resolveRef.current?.({ success: false, message: errMsg });
      return;
    }

    console.log('[SCHEME JOIN] STEP 5 — Payment SUCCESS from Razorpay checkout', { payment_id: paymentData.razorpay_payment_id, order_id: paymentData.razorpay_order_id });
    setPaymentStep(PAYMENT_STEPS.VERIFYING);

    try {
      const verifyPayload = {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      };
      console.log('[SCHEME JOIN] STEP 6 — Verifying payment with backend | PARAMS:', verifyPayload);
      const verifyResponse: any = await razorpayService.verifyPayment(verifyPayload);
      console.log('[SCHEME JOIN] STEP 6 — verify-payment RESPONSE:', verifyResponse);

      // Razorpay itself already confirmed the capture in STEP 5 (we have a
      // real payment_id from checkout). If our backend's verify-payment
      // comes back saying the payment was "already captured/processed" —
      // whatever the exact success flag/code it uses for that case — it
      // means the webhook (or a previous verify call) beat us to recording
      // it, NOT that anything failed. Treat all of these as success so a
      // real payment never surfaces as "FLOW FAILED" to the user.
      const alreadyHandledElsewhere =
        verifyResponse?.code === 'ALREADY_PAID' ||
        verifyResponse?.code === 'ALREADY_PROCESSED' ||
        /already\s*(captured|processed|paid)/i.test(verifyResponse?.message || '');

      const isVerifySuccess =
        verifyResponse?.success === true ||
        verifyResponse?.code === 'PAYMENT_SUCCESS' ||
        alreadyHandledElsewhere;

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
      resolveRef.current?.(successResult);
    } catch (err: any) {
      console.log('[SCHEME JOIN] STEP 6 ERROR — Payment verification failed', err?.message);
      setPaymentStep(PAYMENT_STEPS.FAILED);
      setError(err?.message);
      setLoading(false);
      resolveRef.current?.({ success: false, message: err?.message, error: err });
    }
  }, []);

  const handlePaymentDismiss = useCallback(() => {
    console.log('[SCHEME JOIN] STEP 5 — User dismissed Razorpay checkout. Marking order as failed.');
    setWebViewVisible(false);
    setPaymentStep(PAYMENT_STEPS.IDLE);
    setLoading(false);
    if (currentOrderIdRef.current) {
      razorpayService.markFailed(currentOrderIdRef.current).catch(() => {});
    }
    resolveRef.current?.({ success: false, message: 'Payment cancelled by user' });
  }, []);

  const startPayment = useCallback(
    (
      amount: number,
      userDetails: UserDetails,
      regNo: string | number,
      groupCode: string,
      orderExtras: OrderExtras
    ): Promise<PaymentResult> => {
      if (!amount || amount <= 0) {
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
        setLoading(true);
        setPaymentStep(PAYMENT_STEPS.CREATING_ORDER);
        setError(null);

        (async () => {
          try {
            const createOrderParams = { amount, regNo, groupCode, newJoin: orderExtras.newJoin, nmData: orderExtras.nmData, schemeDetails: orderExtras.schemeDetails };
            console.log('[SCHEME JOIN] STEP 3 — Creating Razorpay order | PARAMS:', createOrderParams);
            const orderResponse: any = await razorpayService.createOrder({
              amount,
              regNo,
              groupCode,
              newJoin: orderExtras.newJoin,
              nmData: orderExtras.nmData,
              schemeDetails: orderExtras.schemeDetails,
            });
            console.log('[SCHEME JOIN] STEP 3 — create-order RESPONSE:', orderResponse);
            if (!orderResponse?.success) throw new Error(orderResponse?.message || 'Order creation failed');

            const backendOrder = orderResponse.data;
            if (!backendOrder?.order_id) throw new Error('Invalid order response from backend');

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
            setTimeout(() => setWebViewVisible(true), Platform.OS === 'ios' ? 400 : 0);
          } catch (err: any) {
            setPaymentStep(PAYMENT_STEPS.FAILED);
            setError(err?.message);
            setLoading(false);
            resolve({ success: false, message: err?.message, error: err });
          }
        })();
      });
    },
    []
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
