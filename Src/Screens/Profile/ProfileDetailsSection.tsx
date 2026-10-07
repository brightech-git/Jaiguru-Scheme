import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppCard, AppText } from '../../Components/ui/appcomponents';
import { userService, UserKycDetails } from '../../api/services/userService';
import { COLORS, SIZES } from '../../Utills/AppTheme';

const display = (value?: string | number) => value === undefined || value === null || String(value).trim() === '' ? 'Not provided' : String(value);
const status = (value?: boolean) => value === undefined ? 'Not provided' : value ? 'Verified' : 'Not verified';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" color={COLORS.contentMuted}>{label}</AppText>
      <AppText variant="bodySmall" color={COLORS.contentPrimary}>{value}</AppText>
    </View>
  );
}

export default function ProfileDetailsSection({ userId }: { userId: string | number | null }) {
  const [details, setDetails] = useState<UserKycDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const requestId = useRef(0);

  useFocusEffect(useCallback(() => {
    const current = ++requestId.current;
    if (userId === null) {
      setDetails(null);
      return;
    }
    setLoading(true);
    setError(false);
    userService.getDetails(userId)
      .then((data) => { if (current === requestId.current) setDetails(data); })
      .catch(() => { if (current === requestId.current) setError(true); })
      .finally(() => { if (current === requestId.current) setLoading(false); });
    return () => { requestId.current++; };
  }, [userId, retry]));

  const groups = details ? [
    { title: 'Personal details', rows: [
      ['User ID', display(details.id)],
      ['Name', display(details.username)],
      ['Email', display(details.email)],
      ['Mobile number', display(details.contactNumber)],
      ['Gender', display(details.gender)],
      ['Date of birth', !details.dateOfBirth || details.dateOfBirth.startsWith('1900-01-01') ? 'Not provided' : details.dateOfBirth.split('T')[0].split('-').reverse().join('/')],
      ['Wallet balance', typeof details.walletBalance === 'number' ? `? ${details.walletBalance.toFixed(2)}` : 'Not provided'],
      ['Referral code', display(details.referralCode)],
    ] },
    { title: 'Address', rows: [
      ['Address line 1', display(details.address1)],
      ['Address line 2', display(details.address2)],
      ['City', display(details.city)],
      ['State', display(details.state)],
      ['Pincode', display(details.pincode)],
      ['Country', display(details.country)],
    ] },
    { title: 'Verification', rows: [
      ['Aadhaar', details.maskedAadhaar ? `XXXX XXXX ${details.maskedAadhaar.replace(/\s/g, '').slice(-4)}` : 'Not provided'],
      ['Aadhaar status', status(details.aadhaarVerified)],
      ['KYC status', status(details.kycVerified)],
      ['Terms accepted', details.termsAccepted === undefined ? 'Not provided' : details.termsAccepted ? 'Yes' : 'No'],
    ] },
  ] : [];

  return (
    <View style={styles.section}>
      <AppText variant="label" color={COLORS.contentMuted} style={styles.title}>PROFILE DETAILS</AppText>
      {loading && <ActivityIndicator color={COLORS.brand} style={styles.loading} />}
      {userId === null && <AppText variant="bodySmall">User details are unavailable. Please sign in again.</AppText>}
      {error && (
        <AppCard style={styles.card}>
          <AppText variant="bodySmall" color={COLORS.dangerText}>Unable to load your latest details.</AppText>
          <Pressable accessibilityRole="button" onPress={() => setRetry((value) => value + 1)} style={styles.retry}>
            <AppText variant="bodyBold" color={COLORS.brand}>Retry</AppText>
          </Pressable>
        </AppCard>
      )}
      {!loading && !error && userId !== null && !details && <AppText variant="bodySmall">No profile details found.</AppText>}
      {groups.map((group) => (
        <AppCard key={group.title} style={styles.card}>
          <AppText variant="bodyBold" color={COLORS.brand}>{group.title}</AppText>
          {group.rows.map(([label, value]) => <DetailRow key={label} label={label} value={value} />)}
        </AppCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: SIZES.space.lg },
  title: { marginLeft: 4, marginBottom: SIZES.space.sm, letterSpacing: 0.5 },
  card: { marginBottom: SIZES.space.sm },
  row: { paddingVertical: SIZES.space.sm, gap: SIZES.space.xs, borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle },
  loading: { padding: SIZES.space.lg },
  retry: { alignSelf: 'flex-start', paddingVertical: SIZES.space.sm },
});
