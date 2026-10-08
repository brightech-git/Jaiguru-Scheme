import { Text } from './Typography/FontText';
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Modal, View, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, StatusBar, Platform } from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { COLORS, SIZES, FONTS } from "../Utills/AppTheme";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────
const UPI_SCHEMES = [
  "gpay://", "phonepe://", "paytmmp://", "upi://",
  "bhim://", "tez://", "credpay://", "mobikwik://",
];

const THEME = {
  bg:      COLORS.surfaceMuted,
  surface: COLORS.surface,
  border:  COLORS.border,
  accent:  COLORS.accent,
  text:    COLORS.contentPrimary,
  textSec: COLORS.contentSecondary,
  error:   COLORS.danger,
  white:   COLORS.surface,
};

export interface RazorpayOptions {
  key?: string;
  amount?: number | string;
  currency?: string;
  order_id?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  [key: string]: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isUpiDeepLink = (url?: string | null): boolean =>
  UPI_SCHEMES.some((scheme) => url?.startsWith(scheme));

const buildHtml = (options: RazorpayOptions): string => {
  const o = options;
  // Escape ALL characters that can break an inline JS string or HTML attribute
  const safeStr = (s: any): string =>
    String(s || '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/`/g, '\\`')
      .replace(/</g, '\\u003C')
      .replace(/>/g, '\\u003E')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0F0F1A; font-family: -apple-system, sans-serif; }
  </style>
</head>
<body>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
(function () {
  var paymentDone = false;

  function post(obj) {
    window.ReactNativeWebView.postMessage(JSON.stringify(obj));
  }

  // Intercept new-window navigation (3DS, NetBanking)
  window.open = function (url) {
    post({ type: 'newwindow', url: url });
    return window;
  };

  try {
  var rzp = new Razorpay({
    key:         "${safeStr(o.key)}",
    amount:      ${parseInt(String(o.amount)) || 0},
    currency:    "${safeStr(o.currency || "INR")}",
    order_id:    "${safeStr(o.order_id)}",
    name:        "${safeStr(o.name)}",
    description: "${safeStr(o.description)}",
    prefill: {
      name:    "${safeStr(o.prefill?.name)}",
      email:   "${safeStr(o.prefill?.email)}",
      contact: "${safeStr(o.prefill?.contact)}"
    },
    theme: { color: "${safeStr(o.theme?.color || COLORS.accent)}" },
    retry: { enabled: false },
    handler: function (response) {
      if (paymentDone) return;
      paymentDone = true;
      post({ type: 'success', data: response });
    },
    modal: {
      escape:        false,
      backdropclose: false,
      ondismiss: function () {
        if (paymentDone) return;
        paymentDone = true;
        post({ type: 'dismiss' });
      }
    }
  });

  rzp.on('payment.failed', function (response) {
    if (paymentDone) return;
    paymentDone = true;
    post({ type: 'failed', data: response.error });
  });

  // Open once. Reopening on UPI return creates a second checkout while
  // the original checkout is still receiving the payment result.
  rzp.open();
  } catch (error) {
    if (!paymentDone) {
      paymentDone = true;
      post({ type: 'failed', data: { description: 'Unable to load secure checkout. Please check your connection.' } });
    }
  }
})();
</script>
</body>
</html>`;
};

// ─── Header Component ─────────────────────────────────────────────────────────
interface WebViewHeaderProps {
  title: string;
  onBack: () => void;
}

const WebViewHeader = ({ title, onBack }: WebViewHeaderProps) => (
  <View style={headerStyles.container}>
    <TouchableOpacity style={headerStyles.backBtn} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Text style={headerStyles.backIcon}>‹</Text>
    </TouchableOpacity>
    <Text style={headerStyles.title} numberOfLines={1}>{title}</Text>
    <View style={headerStyles.spacer} />
  </View>
);

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row", alignItems: "center", height: 52,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingHorizontal: SIZES.space.sm,
  },
  backBtn:  { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 32, color: COLORS.contentPrimary, lineHeight: 36 },
  title:    { flex: 1, fontSize: SIZES.text.lg, fontFamily: FONTS.family.semiBold, color: COLORS.contentPrimary, textAlign: "center" },
  spacer:   { width: 44 },
});

// ─── Loading Overlay ──────────────────────────────────────────────────────────
const LoadingOverlay = () => (
  <View style={overlayStyles.container}>
    <ActivityIndicator size="large" color={THEME.accent} />
    <Text style={overlayStyles.text}>Loading secure checkout…</Text>
  </View>
);

const overlayStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center", justifyContent: "center",
  },
  text: { color: COLORS.contentSecondary, fontSize: SIZES.text.sm, fontFamily: FONTS.family.regular, marginTop: SIZES.space.sm },
});

// ─── Main Component ───────────────────────────────────────────────────────────
interface RazorpayWebViewProps {
  visible: boolean;
  options: RazorpayOptions | null;
  onSuccess: (data: any) => void;
  onDismiss?: () => void;
}

const RazorpayWebView = ({ visible, options, onSuccess, onDismiss }: RazorpayWebViewProps) => {
  const mainWebViewRef = useRef<WebView>(null);
  const bankWebViewRef = useRef<WebView>(null);

  // Refs (no re-render needed)
  const paymentDone  = useRef(false);
  const dismissed    = useRef(false);

  // Keep latest callbacks in refs so handleMessage/shouldStartLoad never
  // change identity — prevents WebView from remounting on every parent render
  const onSuccessRef = useRef(onSuccess);
  const onDismissRef = useRef(onDismiss);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);

  const [bankUrl,       setBankUrl]       = useState<string | null>(null);
  const [bankTitle,     setBankTitle]     = useState("Bank Authentication");
  const [mainLoading,   setMainLoading]   = useState(true);
  const checkoutSource = useMemo(() => options ? ({
    html: buildHtml(options),
    baseUrl: 'https://checkout.razorpay.com',
  }) : null, [options]);

  // Reset all state when modal opens
  useEffect(() => {
    if (visible) {
      paymentDone.current = false;
      dismissed.current   = false;
      setBankUrl(null);
      setMainLoading(true);
    }
  }, [visible]);

  // ── Message handler ──
  const handleMessage = useCallback((event: any) => {
    let msg: any;
    try { msg = JSON.parse(event.nativeEvent.data); }
    catch { return; }
    if (paymentDone.current || dismissed.current) return;

    switch (msg.type) {
      case "success": {
        paymentDone.current = true;
        setBankUrl(null);
        onSuccessRef.current(msg.data);
        break;
      }
      case "failed": {
        if (!dismissed.current) {
          paymentDone.current = true;
          setBankUrl(null);
          onSuccessRef.current({ failed: true, error: msg.data });
        }
        break;
      }
      case "dismiss": {
        if (paymentDone.current || dismissed.current) break;
        dismissed.current = true;
        setBankUrl(null);
        onDismissRef.current?.();
        break;
      }
      case "newwindow": {
        if (typeof msg.url === 'string' && /^https?:\/\//i.test(msg.url)) setBankUrl(msg.url);
        else if (isUpiDeepLink(msg.url)) Linking.openURL(msg.url).catch(() => {
          console.warn('[RazorpayWebView] Unable to open payment app');
        });
        break;
      }
      default:
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // stable — uses refs internally

  // ── UPI deep-link guard ──
  const shouldStartLoad = useCallback((req: { url: string }): boolean => {
    if (isUpiDeepLink(req.url)) {
      if (paymentDone.current || dismissed.current) return false;
      Linking.openURL(req.url).catch(() => {});
      return false;
    }
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // stable

  // ── WebView renderer crash recovery ──
  // Android: renderer process killed under memory pressure → without this
  // handler react-native-webview crashes the ENTIRE app. Catch it and
  // gracefully close the checkout instead.
  const handleRenderProcessGone = useCallback(() => {
    console.warn('[RazorpayWebView] Android WebView renderer crashed — closing checkout gracefully');
    if (!paymentDone.current && !dismissed.current) {
      dismissed.current = true;
      onDismissRef.current?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // iOS: WKWebView content process terminated (same memory-pressure scenario)
  const handleContentProcessDidTerminate = useCallback(() => {
    console.warn('[RazorpayWebView] iOS WebView content process terminated — closing checkout gracefully');
    if (!paymentDone.current && !dismissed.current) {
      dismissed.current = true;
      onDismissRef.current?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Bank WebView navigation ──
  const handleBankNav = useCallback((navState: WebViewNavigation) => {
    if (navState.title) setBankTitle(navState.title);
  }, []);

  const closeBankView = useCallback(() => setBankUrl(null), []);

  // ── Guard: no options ──
  if (!visible || !checkoutSource) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        if (!paymentDone.current && !dismissed.current) {
          dismissed.current = true;
          onDismissRef.current?.();
        }
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      <SafeAreaView edges={['bottom']} style={styles.container}>

        {/* Bank WebView (3DS / NetBanking) */}
        {bankUrl && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 1, backgroundColor: THEME.bg }]}>
            <WebViewHeader title={bankTitle} onBack={closeBankView} />
            <WebView
              ref={bankWebViewRef}
              source={{ uri: bankUrl }}
              onNavigationStateChange={handleBankNav}
              onShouldStartLoadWithRequest={shouldStartLoad}
              onRenderProcessGone={handleRenderProcessGone}
              onContentProcessDidTerminate={handleContentProcessDidTerminate}
              startInLoadingState
              renderLoading={() => <LoadingOverlay />}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
              mixedContentMode="always"
              style={styles.flex}
            />
          </View>
        )}
        {/* Main Razorpay WebView stays mounted underneath bank authentication. */}
          <View style={styles.flex}>
            <WebView
              ref={mainWebViewRef}
              source={checkoutSource}
              onMessage={handleMessage}
              onShouldStartLoadWithRequest={shouldStartLoad}
              onRenderProcessGone={handleRenderProcessGone}
              onContentProcessDidTerminate={handleContentProcessDidTerminate}
              onLoadStart={() => setMainLoading(true)}
              onLoadEnd={()   => setMainLoading(false)}
              startInLoadingState={false}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
              mixedContentMode="always"
              setSupportMultipleWindows={false}
              style={styles.flex}
            />
            {mainLoading && <LoadingOverlay />}
          </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  flex: { flex: 1 },
});

export default RazorpayWebView;
