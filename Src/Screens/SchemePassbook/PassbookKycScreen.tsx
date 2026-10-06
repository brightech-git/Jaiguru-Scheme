import React, { useEffect, useState } from 'react';
import { View, Pressable, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import { AppButton, AppCard, AppInput, AppText, ScreenWrapper } from '../../Components/ui/appcomponents';
import { getUserData, getUserId, updateUserData } from '../../Utills/AsynchStorageHelper';
import { authService } from '../../api/services/authService';
import { Account } from '../../types/Account/Account';
import theme from '../../Utills/AppTheme';

import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import CalendarPicker from '../MemberCreation/CalendarPicker';
import { maskAadhaar } from './passbookUtils';
import { isValidAadhaar } from './aadhaarValidation';

type PostOffice = { Name: string; Block: string | null; State: string; Country: string };
const { COLORS, SIZES } = theme;
type Fields = 'username' | 'email' | 'gender' | 'dateOfBirth' | 'doorNo' | 'address1' | 'address2' | 'city' | 'state' | 'pincode' | 'country';
const fields: { key: Fields; label: string }[] = [
  { key: 'username', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'gender', label: 'Gender' },
  { key: 'dateOfBirth', label: 'Date of birth (YYYY-MM-DD)' }, { key: 'doorNo', label: 'Door No' },
  { key: 'address1', label: 'Street' },
  { key: 'address2', label: 'Address line 2' }, { key: 'city', label: 'City' }, { key: 'state', label: 'State' },
  { key: 'pincode', label: 'PIN code' }, { key: 'country', label: 'Country' },
];
export default function PassbookKycScreen() {
  const navigation = useNavigation<any>();
  const params = useRoute().params as { account: Account; section: 'address' | 'aadhaar' };
  const [values, setValues] = useState<Record<string, string>>({});
  const [postOffices, setPostOffices] = useState<PostOffice[]>([]);
  const [postalLoading, setPostalLoading] = useState(false);
  const [postalError, setPostalError] = useState('');
  const [officePickerOpen, setOfficePickerOpen] = useState(false);
  const [postalRetry, setPostalRetry] = useState(0);
  const [terms, setTerms] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [aadhaar, setAadhaar] = useState('');
  const [existingAadhaar, setExistingAadhaar] = useState('');
  useEffect(() => {
    let active = true;
    getUserData().then(user => {
      if (!active) return;
      const pi = params.account.personalInfo;
      const initialValues = Object.fromEntries(fields.map(({ key }) => [key, String(user?.[key] ?? (key === 'username' ? params.account.pName : key === 'pincode' ? pi?.pinCode : key === 'doorNo' ? pi?.doorNo : pi?.[key as keyof typeof pi]) ?? '')]));
      const combinedAddress = /^(\d[^,]*),(.+)$/.exec(initialValues.address1 || '');
      if (combinedAddress) {
        initialValues.doorNo = combinedAddress[1].trim();
        initialValues.address1 = combinedAddress[2].trim();
      }
      setValues(initialValues);
      setExistingAadhaar(String(user?.maskedAadhaar || pi?.maskedAadhaar || params.account.maskedAadhaar || pi?.aadhaarNo || ''));
      setTerms(user?.termsAccepted === true);
      setReady(true);
    }).catch(() => { if (active) setError('Unable to load your profile. Please reopen this page.'); });
    return () => { active = false; };
  }, [params.account]);
  useEffect(() => {
    if (params.section !== 'address' || !ready) return;
    const pincode = values.pincode || '';
    setPostOffices([]);
    setPostalError('');
    setOfficePickerOpen(false);
    if (!/^\d{6}$/.test(pincode)) { setPostalLoading(false); return; }
    let active = true;
    const controller = new AbortController();
    setPostalLoading(true);
    const debounce = setTimeout(async () => {
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch('https://api.postalpincode.in/pincode/' + pincode, { signal: controller.signal });
        if (!response.ok) throw new Error('Unable to load postal details. Please retry.');
        const data = await response.json();
        const offices: PostOffice[] = data?.[0]?.PostOffice;
        if (!active) return;
        if (data?.[0]?.Status !== 'Success' || !Array.isArray(offices) || !offices.length) {
          throw new Error('No post offices found. Please check your PIN code.');
        }
        setPostOffices(offices);
        setValues(previous => {
          const office = offices.find(item => item.Name === previous.address2) || offices[0];
          return { ...previous, city: office.Block && office.Block !== 'NA' ? office.Block : '', state: office.State || '', country: office.Country || '' };
        });
      } catch (err: any) {
        if (active) setPostalError(err?.name === 'AbortError' ? 'Postal lookup timed out. Please retry.' : err?.message || 'Unable to load postal details. Please retry.');
      } finally {
        clearTimeout(timeout);
        if (active) setPostalLoading(false);
      }
    }, 350);
    return () => { active = false; clearTimeout(debounce); controller.abort(); };
  }, [values.pincode, ready, params.section, postalRetry]);

  const selectOffice = (office: PostOffice) => {
    setValues(previous => ({ ...previous, address2: office.Name, city: office.Block && office.Block !== 'NA' ? office.Block : '', state: office.State || '', country: office.Country || '' }));
    setOfficePickerOpen(false);
  };

  const save = async () => {
    if (saving || !ready) return;
    if (params.section === 'address' && (!values.username?.trim() || !values.doorNo?.trim() || !values.address1?.trim() || !values.city?.trim() || !values.state?.trim() || !/^\d{6}$/.test(values.pincode || '') || !values.country?.trim() || !terms)) {
      setError('Enter your name, door no, street, city, state, six-digit PIN code and country, and accept the terms.'); return;
    }
    if (params.section === 'address' && values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) { setError('Enter a valid email.'); return; }
    if (params.section === 'address' && values.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(values.dateOfBirth)) { setError('Use YYYY-MM-DD for date of birth.'); return; }
    if (params.section === 'aadhaar' && !isValidAadhaar(aadhaar)) { setError('Enter a valid 12-digit Aadhaar number.'); return; }
    setSaving(true); setError('');
    try {
      const id = await getUserId();
      if (!id) throw new Error('User ID is unavailable. Please sign in again.');
      const payload = params.section === 'aadhaar'
        ? { aadhaarVerified: true, maskedAadhaar: aadhaar }
        : { ...Object.fromEntries(fields.filter(({ key }) => key !== 'doorNo').map(({ key }) => [key, (values[key] || '').trim()])), address1: [values.doorNo.trim(), values.address1.trim()].join(','), termsAccepted: terms, kycVerified: true };
      console.log('[KYC UPDATE] Payload:', payload);
      const result = await authService.updateUserInfo(id, payload) as unknown as { status?: string; message?: string; otpSent?: boolean };
      if (String(result.status).toLowerCase() !== 'success') throw new Error(result.message || 'Update failed');
      if ((result as unknown as { otpSent?: boolean }).otpSent) {
        Alert.alert('Verification required', 'The update request sent an OTP. KYC will be shown as verified after the backend confirms verification.');
        return;
      }
      const cached = await updateUserData(payload);
      if (!cached.success) throw new Error('Update saved, but profile refresh failed. Please reopen the passbook.');
      navigation.goBack();
    } catch (err: any) { setError(err?.message || 'Unable to save KYC. Please retry.'); }
    finally { setSaving(false); }
  };
  const change = (key: string, value: string) => setValues(previous => key === 'pincode'
    ? { ...previous, pincode: value.replace(/[^0-9]/g, '').slice(0, 6), address2: '', city: '', state: '', country: '' }
    : { ...previous, [key]: value });
  const input = (key: Fields, label: string, icon: string, required = false) => <AppInput
    key={key} label={label} leftIcon={icon} required={required} value={values[key] || ''}
    editable={ready && !saving} onChangeText={value => change(key, value)}
    keyboardType={key === 'pincode' ? 'number-pad' : key === 'email' ? 'email-address' : 'default'}
    maxLength={key === 'pincode' ? 6 : undefined} autoCapitalize={key === 'email' ? 'none' : 'words'}
    containerStyle={styles.field}
  />;
  return <ScreenWrapper scroll edges={['bottom']} paddingTop={SIZES.space.lg}
    header={<CommonHeader title={params.section === 'address' ? 'Address verification' : 'Aadhaar verification'} subtitle="Complete your member profile" showBack={!saving} />}
    footer={<View style={styles.footer}><AppButton label="Save KYC details" rightIcon="arrow-forward" onPress={save} loading={saving} disabled={!ready || saving || (params.section === 'address' && postalLoading)} /></View>}>
    <LinearGradient colors={COLORS.gradient.accent as [string, string]} style={styles.hero}>
      <View style={styles.heroIcon}><Ionicons name="shield-checkmark-outline" size={28} color={COLORS.contentOnBrand} /></View>
      <AppText variant="labelUppercase" color={COLORS.contentBrand}>{params.section === 'aadhaar' ? 'Aadhaar KYC' : 'Your member profile'}</AppText>
      <AppText variant="h3" color={COLORS.contentOnAccent}>A little detail.
A lasting relationship.</AppText>
      <AppText variant="bodySmall" color={COLORS.contentPrimary}>{params.section === 'aadhaar' ? 'Enter your Aadhaar number to check its format and checksum before submitting.' : 'Confirm your personal and address details to continue your KYC update.'}</AppText>
      <View style={styles.memberTag}><Ionicons name="diamond-outline" size={16} color={COLORS.contentBrand} /><AppText variant="captionBold" color={COLORS.contentBrand}>{params.account.groupCode} ? {params.account.regNo}</AppText></View>
    </LinearGradient>
    {params.section === 'aadhaar' && <AppCard variant="flat" style={styles.section}>
      <AppText variant="h6">Aadhaar details</AppText>
      {!!existingAadhaar && <AppText variant="bodySmall" color={COLORS.contentSecondary}>Current Aadhaar: {maskAadhaar(existingAadhaar)}</AppText>}
      <AppInput label="Full Aadhaar number" required leftIcon="card-outline" value={aadhaar} onChangeText={value => setAadhaar(value.replace(/[^0-9]/g, '').slice(0, 12))} keyboardType="number-pad" secureTextEntry maxLength={12} editable={ready && !saving} containerStyle={styles.field} error={aadhaar.length === 12 && !isValidAadhaar(aadhaar) ? 'Invalid Aadhaar number. Please check the digits.' : undefined} />
      {!!aadhaar && <AppText variant="caption" color={COLORS.contentSecondary}>Display: {maskAadhaar(aadhaar)}</AppText>}
    </AppCard>}
    {params.section === 'address' && <>
    <AppCard variant="flat" style={styles.section}>
      <View style={styles.sectionTitle}><View style={styles.sectionIcon}><Ionicons name="person-outline" size={20} color={COLORS.contentBrand} /></View><View><AppText variant="h6">Personal details</AppText><AppText variant="caption" color={COLORS.contentSecondary}>Tell us about yourself</AppText></View></View>
      {input('username', 'Full name', 'person-outline', true)}
      {input('email', 'Email address', 'mail-outline')}
      <AppText variant="captionBold" style={styles.field}>Gender</AppText>
      <View style={styles.genderRow}>{['Male', 'Female', 'Other'].map(gender => <Pressable key={gender} disabled={!ready || saving} accessibilityRole="radio" accessibilityState={{ checked: values.gender === gender }} onPress={() => change('gender', gender)} style={[styles.gender, values.gender === gender && styles.genderSelected]}><AppText variant="captionBold" color={values.gender === gender ? COLORS.contentBrand : COLORS.contentSecondary}>{gender}</AppText></Pressable>)}</View>
      <AppText variant="captionBold" style={styles.field}>Date of birth</AppText>
      <Pressable disabled={!ready || saving} accessibilityRole="button" accessibilityLabel="Select date of birth" onPress={() => setCalendarOpen(true)} style={styles.dateField}>
        <Ionicons name="calendar-outline" size={20} color={COLORS.contentBrand} />
        <AppText variant="bodySmall" color={values.dateOfBirth ? COLORS.contentPrimary : COLORS.contentMuted} style={{ flex: 1 }}>{values.dateOfBirth ? new Date(values.dateOfBirth.slice(0,10) + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Choose your date of birth'}</AppText>
        <Ionicons name="chevron-down" size={16} color={COLORS.contentBrand} />
      </Pressable>
    </AppCard>
    <AppCard variant="flat" style={styles.section}>
      <View style={styles.sectionTitle}><View style={styles.sectionIcon}><Ionicons name="location-outline" size={20} color={COLORS.contentBrand} /></View><View><AppText variant="h6">Residential address</AppText><AppText variant="caption" color={COLORS.contentSecondary}>Your current place of residence</AppText></View></View>
      {input('doorNo', 'Door No', 'home-outline', true)}
      {input('address1', 'Street / Apartment', 'map-outline', true)}
      {input('pincode', 'PIN code', 'navigate-outline', true)}
      {postalLoading && <View style={styles.postalStatus}><ActivityIndicator size="small" color={COLORS.contentBrand} /><AppText variant="caption" color={COLORS.contentSecondary}>Loading postal details...</AppText></View>}
      {!!postalError && <View style={styles.field}><AppText variant="bodySmall" color={COLORS.dangerText}>{postalError}</AppText><AppButton label="Retry postal lookup" variant="ghost" onPress={() => setPostalRetry(previous => previous + 1)} disabled={saving} /></View>}
      {postOffices.length > 0 ? <>
        <AppText variant="captionBold" style={styles.field}>Area</AppText>
        <Pressable style={styles.dateField} disabled={saving} accessibilityRole="button" accessibilityLabel="Select post office for address line 2" accessibilityState={{ expanded: officePickerOpen }} onPress={() => setOfficePickerOpen(open => !open)}>
          <Ionicons name="business-outline" size={20} color={COLORS.contentBrand} />
          <AppText variant="bodySmall" style={{ flex: 1 }} color={values.address2 ? COLORS.contentPrimary : COLORS.contentMuted}>{values.address2 || 'Select your area'}</AppText>
          <Ionicons name={officePickerOpen ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.contentBrand} />
        </Pressable>
        {officePickerOpen && <View style={styles.officeList}>{postOffices.map((office, index) => <Pressable key={office.Name + index} accessibilityRole="radio" accessibilityState={{ checked: values.address2 === office.Name }} disabled={saving} style={[styles.officeOption, values.address2 === office.Name && styles.genderSelected]} onPress={() => selectOffice(office)}>
          <AppText variant="bodySmall" style={{ flex: 1 }}>{office.Name}</AppText>
          {values.address2 === office.Name && <Ionicons name="checkmark-circle" size={20} color={COLORS.contentBrand} />}
        </Pressable>)}</View>}
      </> : input('address2', 'Address line 2 (optional)', 'business-outline')}
      {input('city', 'City', 'map-outline', true)}
      {input('state', 'State', 'location-outline', true)}

      {input('country', 'Country', 'globe-outline', true)}
    </AppCard>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: terms }} disabled={saving} onPress={() => setTerms(value => !value)} style={styles.consent}>
      <Ionicons name={terms ? 'checkbox' : 'square-outline'} size={24} color={COLORS.contentBrand} />
      <AppText variant="bodySmall" style={{ flex: 1 }}>I accept the terms and confirm these details are correct.</AppText>
    </Pressable>
    </>}
    {!!error && <View style={styles.error}><Ionicons name="information-circle-outline" size={20} color={COLORS.dangerText} /><AppText variant="bodySmall" color={COLORS.dangerText} style={{ flex: 1 }}>{error}</AppText></View>}
    <CalendarPicker visible={calendarOpen} title="Your date of birth" value={values.dateOfBirth?.slice(0, 10) || undefined} maxDate={new Date()} onConfirm={date => { change('dateOfBirth', date); setCalendarOpen(false); }} onCancel={() => setCalendarOpen(false)} />
  </ScreenWrapper>;
}
const styles = StyleSheet.create({
  postalStatus: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.sm, marginTop: SIZES.space.sm },
  officeList: { marginTop: SIZES.space.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius.md, overflow: 'hidden' },
  officeOption: { flexDirection: 'row', alignItems: 'center', minHeight: 48, padding: SIZES.space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.divider },
  hero: { padding: SIZES.space.xl, borderRadius: SIZES.radius.card, gap: SIZES.space.md },
  heroIcon: { width: 52, height: 52, borderRadius: SIZES.radius.lg, backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center' },
  memberTag: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.sm, alignSelf: 'flex-start', padding: SIZES.space.sm, borderRadius: SIZES.radius.pill, backgroundColor: COLORS.whiteAlpha70 },
  section: { marginTop: SIZES.space.xl, padding: SIZES.space.xl },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.md, marginBottom: SIZES.space.sm },
  sectionIcon: { width: 42, height: 42, borderRadius: SIZES.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.brandTint },
  field: { marginTop: SIZES.space.lg },
  genderRow: { flexDirection: 'row', gap: SIZES.space.sm, marginTop: SIZES.space.sm },
  gender: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius.control, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.fieldBackground },
  genderSelected: { backgroundColor: COLORS.brandTint, borderColor: COLORS.borderBrand },
  dateField: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.md, minHeight: 52, padding: SIZES.space.md, marginTop: SIZES.space.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius.field, backgroundColor: COLORS.fieldBackground },
  consent: { flexDirection: 'row', gap: SIZES.space.md, alignItems: 'center', paddingVertical: SIZES.space.xl },
  error: { flexDirection: 'row', gap: SIZES.space.sm, padding: SIZES.space.md, backgroundColor: COLORS.dangerSurface, borderRadius: SIZES.radius.md },
  footer: { padding: SIZES.space.lg, backgroundColor: COLORS.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.divider },
});
