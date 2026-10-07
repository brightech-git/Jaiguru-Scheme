import { Text } from '../../Components/Typography/FontText';
// Src/Screens/AccountDelete/AccountDelete.tsx
import React, { useState, useEffect } from 'react';
import { SafeAreaView, Alert, View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import theme from '../../Utills/AppTheme';
import { getUserId } from '../../Utills/AsynchStorageHelper';
import { useDeleteAccount } from '../../api/hooks/User/useDeleteAccount';
import { AppButton } from '../../Components/ui/appcomponents';

const { COLORS, SIZES, FONTS, ELEVATION, verticalScale, moderateScale } = theme;

const CONSEQUENCES = [
  'Your profile will be permanently removed',
  'All personal information will be deleted from our servers',
  'You will lose access to all your saved data and schemes',
  'Any ongoing transactions will be cancelled',
  'Account recovery will not be possible',
];

const CONSIDERATIONS = [
  'Complete any pending scheme payments before deletion',
  'Download any important information beforehand',
  'Clear any outstanding balances',
  'Contact support if you have any doubts',
];

function DeleteAccount() {
  const navigation = useNavigation<any>();
  const [userId, setUserId] = useState<string | number | null>(null);
  const { deleteAccount, loading } = useDeleteAccount();

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  const confirmDelete = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently delete your account and all associated data. This action CANNOT be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: handleDeleteAccount,
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteAccount = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please try again.');
      return;
    }

    try {
      const result: any = await deleteAccount(userId);
      await AsyncStorage.clear();
      Alert.alert('Account Deleted', result?.message || 'Your account has been permanently deleted.', [
        {
          text: 'OK',
          onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Deletion Failed', error?.message || 'Failed to delete account. Please check your connection and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader title="Delete Account" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <View style={styles.warningIconWrap}>
            <Icon name="warning" size={moderateScale(36)} color={COLORS.danger} />
          </View>
          <Text style={styles.warningTitle}>Delete Your Account</Text>
          <Text style={styles.warningSubtitle}>This action is permanent and cannot be undone</Text>
        </View>

        {/* What Happens */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="info-outline" size={SIZES.icon.md} color={COLORS.danger} />
            <Text style={styles.cardTitle}>What happens when you delete?</Text>
          </View>
          {CONSEQUENCES.map((item, i) => (
            <View key={i} style={styles.listRow}>
              <Icon name="remove-circle-outline" size={SIZES.icon.sm} color={COLORS.danger} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Important Considerations */}
        <View style={[styles.card, styles.cardWarning]}>
          <View style={styles.cardHeader}>
            <Icon name="priority-high" size={SIZES.icon.md} color={COLORS.warning} />
            <Text style={styles.cardTitle}>Before you delete</Text>
          </View>
          {CONSIDERATIONS.map((item, i) => (
            <View key={i} style={styles.listRow}>
              <Icon name="check-circle-outline" size={SIZES.icon.sm} color={COLORS.warning} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Final Warning */}
        <View style={styles.finalWarning}>
          <Icon name="error-outline" size={SIZES.icon.lg} color={COLORS.danger} />
          <Text style={styles.finalWarningText}>Once deleted, your account and all data cannot be recovered.</Text>
        </View>

        {/* Buttons */}
        <AppButton
          label="Delete My Account"
          variant="danger"
          size="lg"
          loading={loading}
          onPress={confirmDelete}
          leftIcon="trash"
          style={{ marginBottom: SIZES.space.sm }}
        />

        <AppButton label="Cancel" variant="outline" size="lg" onPress={() => navigation.goBack()} disabled={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
  },
  content: {
    padding: SIZES.space.lg,
    paddingBottom: verticalScale(40),
  },

  // Warning Banner
  warningBanner: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.space.xl,
    marginBottom: SIZES.space.md,
    borderWidth: 1.5,
    borderColor: COLORS.danger + '40',
    ...ELEVATION.raised,
  },
  warningIconWrap: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.danger + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.space.sm,
  },
  warningTitle: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.xxl,
    color: COLORS.danger,
    marginBottom: SIZES.space.xs,
  },
  warningSubtitle: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.md,
    color: COLORS.contentSecondary,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    padding: SIZES.space.lg,
    marginBottom: SIZES.space.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    ...ELEVATION.raised,
  },
  cardWarning: {
    borderLeftColor: COLORS.warning,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.space.sm,
    gap: SIZES.space.sm,
  },
  cardTitle: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.lg,
    color: COLORS.contentPrimary,
    flex: 1,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.space.sm,
    gap: SIZES.space.sm,
  },
  listText: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.md,
    color: COLORS.contentPrimary,
    flex: 1,
    lineHeight: SIZES.text.md * 1.5,
  },

  // Final Warning
  finalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger + '10',
    borderRadius: SIZES.radius.md,
    padding: SIZES.space.lg,
    marginBottom: SIZES.space.lg,
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
    gap: SIZES.space.sm,
  },
  finalWarningText: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.md,
    color: COLORS.danger,
    flex: 1,
    lineHeight: SIZES.text.md * 1.5,
  },

  // Buttons
  deleteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    borderRadius: SIZES.radius.control,
    paddingVertical: SIZES.space.lg,
    marginBottom: SIZES.space.sm,
    gap: SIZES.space.sm,
    ...ELEVATION.floating,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  deleteBtnText: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.lg,
    color: COLORS.contentOnBrand,
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radius.control,
    paddingVertical: SIZES.space.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cancelBtnText: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.lg,
    color: COLORS.contentSecondary,
  },
});

export default DeleteAccount;
