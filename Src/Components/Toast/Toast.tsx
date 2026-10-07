import { Text } from '../Typography/FontText';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import theme from '../../Utills/AppTheme';

const { width } = Dimensions.get('window');
const { COLORS, SIZES, FONTS, ELEVATION } = theme;

// ─── Types ────────────────────────────────────────────────────────────────────

export const ToastTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  DEFAULT: 'default',
  PREMIUM: 'premium',
  PROGRESS: 'progress',
} as const;

export const ToastPositions = {
  TOP: 'top',
  BOTTOM: 'bottom',
  CENTER: 'center',
} as const;

export const ToastAnimationTypes = {
  SLIDE: 'slide',
  FADE: 'fade',
  SCALE: 'scale',
  BOUNCE: 'bounce',
} as const;

type ToastType = typeof ToastTypes[keyof typeof ToastTypes];
type ToastPosition = typeof ToastPositions[keyof typeof ToastPositions];
type ToastAnimationType = typeof ToastAnimationTypes[keyof typeof ToastAnimationTypes];

export interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  title?: string | null;
  position?: ToastPosition;
  animationType?: ToastAnimationType;
  showProgress?: boolean;
  progress?: number;
  actionText?: string | null;
  onActionPress?: (() => void) | null;
  customIcon?: string | null;
  customBackground?: React.ReactNode | null;
  customStyle?: StyleProp<ViewStyle> | null;
}

// ─── Config per type ──────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ToastType, {
  icon: string;
  gradient: [string, string];
  accent: string;
  iconBg: string;
}> = {
  success: {
    icon: 'check-circle',
    gradient: [COLORS.surfaceInverse, COLORS.surfaceInverse],
    accent: COLORS.successOnInverse,
    iconBg: 'rgba(18,138,94,0.18)',
  },
  error: {
    icon: 'close-circle',
    gradient: [COLORS.surfaceInverse, COLORS.surfaceInverse],
    accent: COLORS.dangerOnInverse,
    iconBg: 'rgba(198,40,40,0.18)',
  },
  warning: {
    icon: 'alert-circle',
    gradient: [COLORS.surfaceInverse, COLORS.surfaceInverse],
    accent: COLORS.warningOnInverse,
    iconBg: 'rgba(183,121,31,0.18)',
  },
  info: {
    icon: 'information-outline',
    gradient: [COLORS.surfaceInverse, COLORS.surfaceInverse],
    accent: COLORS.infoOnInverse,
    iconBg: 'rgba(31,111,208,0.18)',
  },
  premium: {
    icon: 'crown',
    gradient: [COLORS.brandDeep, COLORS.brand],
    accent: COLORS.accent,
    iconBg: COLORS.brandAlpha32,
  },
  default: {
    icon: 'bell-outline',
    gradient: [COLORS.surfaceInverse, COLORS.surfaceInverse],
    accent: COLORS.accent,
    iconBg: COLORS.brandAlpha16,
  },
  progress: {
    icon: 'progress-clock',
    gradient: [COLORS.surfaceInverse, COLORS.surfaceInverse],
    accent: COLORS.brandSoft,
    iconBg: COLORS.brandAlpha16,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ToastComponentProps extends ToastConfig {
  visible: boolean;
  onHide?: (() => void) | null;
  hideOnTap?: boolean;
  showCloseButton?: boolean;
}

const ToastComponent = ({
  visible,
  message,
  type = 'default',
  duration = 3000,
  title,
  position = 'top',
  animationType = 'slide',
  customIcon,
  customStyle,
  actionText,
  onActionPress,
  showCloseButton = true,
  hideOnTap = true,
  onHide,
}: ToastComponentProps) => {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(position === 'bottom' ? 80 : -80);
  const scale = useSharedValue(0.88);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.default;
  const icon = customIcon ?? cfg.icon;

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    opacity.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) });
    translateY.value = withTiming(
      position === 'bottom' ? 80 : -80,
      { duration: 220 },
      (done) => { if (done) runOnJS(onHide ?? (() => {}))(); },
    );
    scale.value = withTiming(0.88, { duration: 220 });
  }, [opacity, translateY, scale, position, onHide]);

  useEffect(() => {
    if (!visible) return;
    translateY.value = position === 'bottom' ? 80 : -80;
    scale.value = 0.88;
    opacity.value = 0;

    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    scale.value = withSpring(1, { damping: 16, stiffness: 220 });

    if (duration > 0) {
      timerRef.current = setTimeout(hide, duration);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const posStyle = position === 'bottom'
    ? { bottom: insets.bottom + SIZES.space.lg }
    : { top: insets.top + SIZES.space.sm };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.wrapper, posStyle, animStyle, customStyle as any]}>
      <Pressable onPress={hideOnTap ? hide : undefined} style={styles.pressable}>
        {/* Dark pill container */}
        <View style={styles.pill}>
          {/* Left accent bar */}
          <View style={[styles.accentBar, { backgroundColor: cfg.accent }]} />

          {/* Icon bubble */}
          <View style={[styles.iconBubble, { backgroundColor: cfg.iconBg }]}>
            <MaterialCommunityIcons name={icon as any} size={20} color={cfg.accent} />
          </View>

          {/* Text */}
          <View style={styles.textWrap}>
            {title ? (
              <>
                <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
                <Text style={styles.messageText} numberOfLines={2}>{message}</Text>
              </>
            ) : (
              <Text style={styles.messageText} numberOfLines={2}>{message}</Text>
            )}
          </View>

          {/* Action or close */}
          {actionText && onActionPress ? (
            <Pressable onPress={onActionPress} style={[styles.actionBtn, { borderColor: cfg.accent }]}>
              <Text style={[styles.actionText, { color: cfg.accent }]}>{actionText}</Text>
            </Pressable>
          ) : showCloseButton ? (
            <Pressable onPress={hide} hitSlop={10} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={16} color="rgba(255,255,255,0.4)" />
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface ToastState extends ToastConfig {
  visible: boolean;
}

export const useToast = () => {
  const [state, setState] = useState<ToastState>({ visible: false, message: '' });

  const showToast = useCallback((config: ToastConfig) => {
    setState({ ...config, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setState((prev) => ({ ...prev, progress }));
  }, []);

  const Toast = useCallback(
    () => <ToastComponent {...state} onHide={hideToast} />,
    [state, hideToast],
  );

  return { showToast, hideToast, updateProgress, Toast, toastState: state };
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: SIZES.space.lg,
    right: SIZES.space.lg,
    zIndex: 9999,
  },
  pressable: {
    borderRadius: SIZES.radius.xl,
    overflow: 'hidden',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: SIZES.radius.xl,
    paddingVertical: SIZES.space.sm + 2,
    paddingRight: SIZES.space.lg,
    overflow: 'hidden',
    ...ELEVATION.overlay,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginLeft: SIZES.space.sm,
    marginRight: SIZES.space.sm,
    minHeight: 32,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.space.sm,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.sm,
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  messageText: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.sm,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: SIZES.text.sm * 1.45,
  },
  actionBtn: {
    paddingHorizontal: SIZES.space.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radius.sm,
    borderWidth: 1,
    marginLeft: SIZES.space.sm,
  },
  actionText: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.xxs,
  },
  closeBtn: {
    marginLeft: SIZES.space.sm,
    padding: 2,
  },
});

// ─── Quick helpers (kept for backward compat) ─────────────────────────────────

export const showSuccessToast = (message: string, title = 'Success', duration = 3000) =>
  ({ visible: true, message, title, type: ToastTypes.SUCCESS, duration } as ToastConfig & { visible: boolean });

export const showErrorToast = (message: string, title = 'Error', duration = 4000) =>
  ({ visible: true, message, title, type: ToastTypes.ERROR, duration } as ToastConfig & { visible: boolean });

export const showPremiumToast = (message: string, title = 'Premium', duration = 3000) =>
  ({ visible: true, message, title, type: ToastTypes.PREMIUM, duration } as ToastConfig & { visible: boolean });

export const showProgressToast = (message: string, title = 'Loading...', initialProgress = 0) =>
  ({ visible: true, message, title, type: ToastTypes.PROGRESS, duration: 0, showProgress: true, progress: initialProgress } as ToastConfig & { visible: boolean });

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const { Toast } = useToast();
  return <>{children}<Toast /></>;
};

export default ToastComponent;
