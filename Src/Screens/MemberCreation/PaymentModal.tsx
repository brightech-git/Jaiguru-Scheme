// Src/Screens/MemberCreation/PaymentModal.tsx
import React from 'react';
import { View, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppText, AppCard, AppButton } from '../../Components/ui/appcomponents';
import theme from '../../Utills/AppTheme';

const { COLORS, SIZES } = theme;

export type PaymentModalStep = 'creating_order' | 'verifying' | 'failed' | 'success' | string;

export interface SuccessDetails {
  personalId?: string;
  regNo?: string;
  groupCode?: string;
  schemeName?: string;
  amount?: string;
  sno?: string;
}

export interface PaymentModalProps {
  visible: boolean;
  step?: PaymentModalStep;
  error?: string | null;
  successDetails?: SuccessDetails | null;
  onSuccessClose?: () => void;
}

const CONTENT_BY_STEP: Record<string, { title: string; message: string; icon: string; color: string }> = {
  creating_order: {
    title: 'Payment Initiated',
    message: 'Please wait while we set up your payment order...',
    icon: 'receipt-outline',
    color: COLORS.contentBrand,
  },
  verifying: {
    title: 'Verifying Payment',
    message: 'Please wait while we confirm your payment...',
    icon: 'shield-checkmark-outline',
    color: COLORS.contentBrand,
  },
  failed: {
    title: 'Payment Failed',
    message: '',
    icon: 'close-circle-outline',
    color: COLORS.danger,
  },
};

const DEFAULT_CONTENT = {
  title: 'Processing',
  message: 'Please wait...',
  icon: 'hourglass-outline',
  color: COLORS.contentBrand,
};

const PaymentModal = ({ visible, step, error, successDetails, onSuccessClose }: PaymentModalProps) => {
  const content = CONTENT_BY_STEP[step || ''] || DEFAULT_CONTENT;
  const isFailed = step === 'failed';
  const isSuccess = step === 'success';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <AppCard variant="elevated" style={styles.card}>
          {isSuccess ? (
            <>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.success + '22' }]}>
                <Icon name="checkmark-circle-outline" size={40} color={COLORS.success} />
              </View>
              <AppText variant="h5" align="center" style={styles.title}>Member Created!</AppText>
              <View style={styles.detailsBlock}>
                {[
                  { label: 'Personal ID', value: successDetails?.personalId },
                  { label: 'Reg No', value: successDetails?.regNo },
                  { label: 'Group Code', value: successDetails?.groupCode },
                  { label: 'Scheme', value: successDetails?.schemeName },
                  { label: 'Amount', value: successDetails?.amount ? `₹${successDetails.amount}` : undefined },
                  // { label: 'Receipt No', value: successDetails?.sno },
                ].map(({ label, value }) => value ? (
                  <View key={label} style={styles.detailRow}>
                    <AppText variant="bodySmall" color={COLORS.contentSecondary}>{label}</AppText>
                    <AppText variant="bodyBold">{value}</AppText>
                  </View>
                ) : null)}
              </View>
              <AppButton label="OK" onPress={onSuccessClose} style={styles.okBtn} />
            </>
          ) : (
            <>
              <View style={[styles.iconCircle, { backgroundColor: isFailed ? COLORS.danger + '22' : COLORS.accentSoft }]}>
                <Icon name={content.icon} size={40} color={content.color} />
              </View>
              <AppText variant="h5" align="center" style={styles.title}>
                {content.title}
              </AppText>
              <AppText variant="bodySmall" color={COLORS.contentSecondary} align="center" style={styles.message}>
                {isFailed ? error || 'Something went wrong. Please try again.' : content.message}
              </AppText>
              {!isFailed && <ActivityIndicator size="large" color={COLORS.contentBrand} style={styles.spinner} />}
            </>
          )}
        </AppCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 20, 25, 0.55)',
    padding: SIZES.space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.space.lg,
  },
  title: {
    marginBottom: SIZES.space.xs,
  },
  message: {
    marginBottom: SIZES.space.lg,
  },
  spinner: {
    marginTop: SIZES.space.xs,
  },
  detailsBlock: {
    width: '100%',
    marginBottom: SIZES.space.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.space.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  okBtn: {
    width: '100%',
  },
});

export default PaymentModal;
