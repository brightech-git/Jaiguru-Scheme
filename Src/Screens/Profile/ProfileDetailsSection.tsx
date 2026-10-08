import React, { useCallback, useEffect, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import CalendarPicker from '../MemberCreation/CalendarPicker';
import { ActivityIndicator, Alert, Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppButton, AppCard, AppInput, AppText } from '../../Components/ui/appcomponents';
import { userService, UserKycDetails } from '../../api/services/userService';
import { authService } from '../../api/services/authService';
import { updateUserData } from '../../Utills/AsynchStorageHelper';
import { COLORS, SIZES, FONTS } from '../../Utills/AppTheme';

const display = (value?: string | number) => value === undefined || value === null || String(value).trim() === '' ? 'Not provided' : String(value);
const status = (value?: boolean) => value === undefined ? 'Not provided' : value ? 'Verified' : 'Not verified';
const editableFields = [
  { key: 'username', label: 'Name', group: 'Personal details' },
  { key: 'email', label: 'Email', group: 'Personal details' },
  { key: 'gender', label: 'Gender', group: 'Personal details' },
  { key: 'dateOfBirth', label: 'Date of birth (YYYY-MM-DD)', group: 'Personal details' },
  { key: 'address1', label: 'Address line 1', group: 'Address' },
  { key: 'pincode', label: 'Pincode', group: 'Address' },
  { key: 'address2', label: 'Area / Post office', group: 'Address' },
  { key: 'city', label: 'City', group: 'Address' },
  { key: 'state', label: 'State', group: 'Address' },
  { key: 'country', label: 'Country', group: 'Address' },
] as const;
type EditableField = typeof editableFields[number]['key'];
type ProfileDraft = Record<EditableField, string>;
type PostOffice = { Name: string; Block: string | null; District?: string; State: string; Country: string };
const makeDraft = (details: UserKycDetails): ProfileDraft => Object.fromEntries(
  editableFields.map(({ key }) => [key, key === 'dateOfBirth'
    ? (!details.dateOfBirth || details.dateOfBirth.startsWith('1900-01-01') ? '' : details.dateOfBirth.split('T')[0])
    : String(details[key] ?? '')]),
) as ProfileDraft;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="bodySmall" color={COLORS.contentSecondary} style={styles.fieldLabel}>{label}</AppText>
      <AppText variant="bodyMedium" color={value === 'Not provided' ? COLORS.contentMuted : COLORS.contentPrimary} style={styles.fieldValue}>{value}</AppText>
    </View>
  );
}

export default function ProfileDetailsSection({ userId, allowEdit = false }: { userId: string | number | null; allowEdit?: boolean }) {
  const [details, setDetails] = useState<UserKycDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const requestId = useRef(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const saveBusy = useRef(false);
  const [postOffices, setPostOffices] = useState<PostOffice[]>([]);
  const [postalLoading, setPostalLoading] = useState(false);
  const [postalError, setPostalError] = useState('');
  const [postalRetry, setPostalRetry] = useState(0);
  const [officePickerOpen, setOfficePickerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    setPostOffices([]);
    setPostalError('');
    setOfficePickerOpen(false);
    if (!editing || !/^\d{6}$/.test(draft?.pincode || '')) { setPostalLoading(false); return; }
    let active = true;
    const controller = new AbortController();
    setPostalLoading(true);
    const pincode = draft!.pincode;
    const debounce = setTimeout(async () => {
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Unable to load postal details. Please retry.');
        const data = await response.json();
        const offices: PostOffice[] = data?.[0]?.PostOffice;
        if (!active) return;
        if (data?.[0]?.Status !== 'Success' || !Array.isArray(offices) || !offices.length) throw new Error('No post offices found. Please check your pincode.');
        setPostOffices(offices);
        setDraft(previous => {
          if (!previous || previous.pincode !== pincode) return previous;
          // Preserve the saved address until the user changes the pincode.
          if (pincode === String(details?.pincode || '')) return previous;
          const office = offices.find(item => item.Name === previous.address2) || offices[0];
          return { ...previous, address2: office.Name, city: office.Block && office.Block !== 'NA' ? office.Block : office.District || '', state: office.State || '', country: office.Country || '' };
        });
      } catch (err: any) {
        if (active) setPostalError(err?.name === 'AbortError' ? 'Postal lookup timed out. Please retry.' : err?.message || 'Unable to load postal details.');
      } finally {
        clearTimeout(timeout);
        if (active) setPostalLoading(false);
      }
    }, 350);
    return () => { active = false; clearTimeout(debounce); controller.abort(); };
  }, [editing, draft?.pincode, postalRetry, details?.pincode]);

  const change = (key: EditableField, value: string) => {
    setSaveError('');
    if (key === 'pincode' && value.replace(/\D/g, '').slice(0, 6) !== draft?.pincode) {
      setPostOffices([]);
      setOfficePickerOpen(false);
    }
    setDraft(previous => {
      if (!previous) return previous;
      if (key !== 'pincode') return { ...previous, [key]: value };
      const pincode = value.replace(/\D/g, '').slice(0, 6);
      if (pincode === previous.pincode) return previous;
      return { ...previous, pincode, address2: '', city: '', state: '', country: '' };
    });
  };

  const selectOffice = (office: PostOffice) => {
    setDraft(previous => previous ? { ...previous, address2: office.Name, city: office.Block && office.Block !== 'NA' ? office.Block : office.District || '', state: office.State || '', country: office.Country || '' } : previous);
    setOfficePickerOpen(false);
  };

  useFocusEffect(useCallback(() => {
    const current = ++requestId.current;
    setEditing(false);
    setSaveError('');
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

  const beginEdit = () => {
    if (!details || loading || saveBusy.current) return;
    setDraft(makeDraft(details));
    setSaveError('');
    setEditing(true);
  };

  const save = async () => {
    if (!draft || !details || userId === null || saveBusy.current || postalLoading) return;
    const values = Object.fromEntries(editableFields.map(({ key }) => [key, draft[key].trim()])) as ProfileDraft;
    if (!values.username) { setSaveError('Enter your name.'); return; }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) { setSaveError('Enter a valid email address.'); return; }
    if (values.pincode && !/^\d{6}$/.test(values.pincode)) { setSaveError('Enter a six-digit pincode.'); return; }
    if (values.dateOfBirth) {
      const date = new Date(`${values.dateOfBirth}T00:00:00Z`);
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(values.dateOfBirth) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== values.dateOfBirth || values.dateOfBirth > todayString) {
        setSaveError('Enter a valid date of birth in YYYY-MM-DD format.'); return;
      }
    }
    const original = makeDraft(details);
    const payload = Object.fromEntries(editableFields.filter(({ key }) => values[key] !== original[key]).map(({ key }) => [key, values[key]]));
    if (!Object.keys(payload).length) { setEditing(false); return; }
    saveBusy.current = true;
    setSaving(true);
    setSaveError('');
    const current = requestId.current;
    try {
      const response = await authService.updateUserInfo(userId, payload) as { status?: string; success?: boolean; message?: string; otpSent?: boolean };
      if (response.success === false || (response.success !== true && String(response.status).toLowerCase() !== 'success')) {
        throw new Error(response.message || 'Unable to update your profile. Please try again.');
      }
      if (response.otpSent) {
        if (current === requestId.current) setSaveError('Verification is required before these changes can be confirmed. Please complete the OTP verification.');
        return;
      }
      const cached = await updateUserData({ ...payload, ...(payload.username ? { name: payload.username } : {}) });
      if (current !== requestId.current) return;
      setDetails(previous => previous ? { ...previous, ...payload } : previous);
      setEditing(false);
      Keyboard.dismiss();
      if (!cached.success) {
        Alert.alert('Profile updated', 'Your changes were saved on the server, but could not be saved on this device.');
      } else {
        Alert.alert('Profile updated', 'Your profile changes have been saved.');
      }
      setRetry(value => value + 1);
    } catch (err: any) {
      if (current === requestId.current) setSaveError(err?.message || 'Unable to update your profile. Please try again.');
    } finally {
      saveBusy.current = false;
      setSaving(false);
    }
  };

  const groups = details ? [
    { title: 'Personal details', rows: [
      ['User ID', display(details.id)],
      ['Name', display(details.username)],
      ['Email', display(details.email)],
      ['Mobile number', display(details.contactNumber)],
      ['Gender', display(details.gender)],
      ['Date of birth', !details.dateOfBirth || details.dateOfBirth.startsWith('1900-01-01') ? 'Not provided' : details.dateOfBirth.split('T')[0].split('-').reverse().join('/')],
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
      {details && <AppCard style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.avatar}><AppText variant="h3" color={COLORS.contentOnBrand}>{(details.username || 'U').charAt(0).toUpperCase()}</AppText></View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold" numberOfLines={2}>{details.username || 'Your profile'}</AppText>
            <AppText variant="caption" color={COLORS.contentSecondary}>{editing ? 'Update your personal and address details' : details.contactNumber || 'Manage your personal details'}</AppText>
          </View>
        </View>
        {allowEdit && !editing && !loading && !error && <AppButton label="Edit profile" variant="outline" onPress={beginEdit} disabled={saving} />}
      </AppCard>}
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
          <View style={styles.groupHeader}>
            <View style={styles.groupIcon}><Ionicons name={group.title === 'Address' ? 'location-outline' : group.title === 'Verification' ? 'shield-checkmark-outline' : 'person-outline'} size={20} color={COLORS.brand} /></View>
            <View style={{ flex: 1 }}><AppText variant="bodyBold" style={styles.groupTitle}>{group.title}</AppText><AppText variant="caption" color={COLORS.contentSecondary}>{group.title === 'Address' ? 'Your current place of residence' : group.title === 'Verification' ? 'Your account verification status' : 'Your contact and personal information'}</AppText></View>
          </View>
          {editing && draft && group.title !== 'Verification' ? (
            <>
              {editableFields.filter(field => field.group === group.title).map(({ key, label }) => {
                if (key === 'gender') return <View key={key} style={styles.input}><AppText variant="captionBold">Gender</AppText><View style={styles.genderRow}>{['Male', 'Female', 'Other'].map(gender => <Pressable key={gender} disabled={saving} accessibilityRole="radio" accessibilityState={{ checked: draft.gender.toLowerCase() === gender.toLowerCase() }} onPress={() => change('gender', gender)} style={[styles.gender, draft.gender.toLowerCase() === gender.toLowerCase() && styles.selected]}><AppText variant="captionBold" color={draft.gender.toLowerCase() === gender.toLowerCase() ? COLORS.brand : COLORS.contentSecondary}>{gender}</AppText></Pressable>)}</View></View>;
                if (key === 'dateOfBirth') return <View key={key} style={styles.input}><AppText variant="captionBold">Date of birth</AppText><Pressable disabled={saving} accessibilityRole="button" accessibilityLabel="Choose date of birth" onPress={() => setCalendarOpen(true)} style={styles.selector}><Ionicons name="calendar-outline" size={20} color={COLORS.brand} /><AppText variant="bodySmall" style={{ flex: 1 }}>{draft.dateOfBirth || 'Choose your date of birth'}</AppText><Ionicons name="chevron-down" size={16} color={COLORS.brand} /></Pressable></View>;
                if (key === 'address2' && postOffices.length) return <View key={key} style={styles.input}>
                  <AppText variant="captionBold">Area / Post office</AppText>
                  <Pressable disabled={saving} accessibilityRole="button" accessibilityState={{ expanded: officePickerOpen }} onPress={() => setOfficePickerOpen(open => !open)} style={styles.selector}><Ionicons name="business-outline" size={20} color={COLORS.brand} /><AppText variant="bodySmall" style={{ flex: 1 }}>{draft.address2 || 'Select your area'}</AppText><Ionicons name={officePickerOpen ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.brand} /></Pressable>
                  {officePickerOpen && <View style={styles.officeList}>{postOffices.map((office, index) => <Pressable key={office.Name + index} disabled={saving} accessibilityRole="radio" accessibilityState={{ checked: draft.address2 === office.Name }} onPress={() => selectOffice(office)} style={[styles.officeOption, draft.address2 === office.Name && styles.selected]}><AppText variant="bodySmall" style={{ flex: 1 }}>{office.Name}</AppText>{draft.address2 === office.Name && <Ionicons name="checkmark-circle" size={18} color={COLORS.brand} />}</Pressable>)}</View>}
                </View>;
                return <View key={key}><AppInput label={label} value={draft[key]} editable={!saving}
                  onChangeText={value => change(key, value)}
                  keyboardType={key === 'email' ? 'email-address' : key === 'pincode' ? 'number-pad' : 'default'}
                  autoCapitalize={key === 'email' ? 'none' : 'words'}
                  maxLength={key === 'pincode' ? 6 : undefined}
                  containerStyle={styles.input}
                />
                {key === 'pincode' && <>
                  <AppText variant="caption" color={COLORS.contentSecondary}>Enter your pincode to find your area, city and state.</AppText>
                  {postalLoading && <View style={styles.postalStatus}><ActivityIndicator size="small" color={COLORS.brand} /><AppText variant="caption">Finding postal details...</AppText></View>}
                  {!!postalError && <View style={styles.postalStatus}><View style={{ flex: 1 }}><AppText variant="caption" color={COLORS.dangerText}>{postalError} You can also enter the address manually.</AppText><AppButton label="Retry lookup" variant="ghost" disabled={saving} onPress={() => setPostalRetry(value => value + 1)} /></View></View>}
                </>}
                </View>;
              })}
              {group.title === 'Personal details' && <DetailRow label="Mobile number" value={display(details?.contactNumber)} />}
            </>
          ) : group.rows.map(([label, value]) => <DetailRow key={label} label={label} value={value} />)}
        </AppCard>
      ))}
      {editing && (
        <View style={styles.actions}>
          {!!saveError && <View accessibilityLiveRegion="polite"><AppText variant="bodySmall" color={COLORS.dangerText}>{saveError}</AppText></View>}
          <AppButton label="Save changes" onPress={save} loading={saving} disabled={saving || postalLoading} />
          <Pressable accessibilityRole="button" disabled={saving} onPress={() => { setEditing(false); setSaveError(''); Keyboard.dismiss(); }} style={styles.retry}>
            <AppText variant="bodyBold" color={COLORS.contentSecondary}>Cancel</AppText>
          </Pressable>
        </View>
      )}
      <CalendarPicker visible={calendarOpen && editing} title="Your date of birth" value={draft?.dateOfBirth || undefined} maxDate={new Date()} onConfirm={date => { change('dateOfBirth', date); setCalendarOpen(false); }} onCancel={() => setCalendarOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: SIZES.space.lg },
  title: { fontFamily: FONTS.family.semiBold, fontSize: 12, lineHeight: 18, marginLeft: 4, marginBottom: SIZES.space.sm, letterSpacing: 0.5 },
  groupTitle: { fontFamily: FONTS.family.semiBold, fontSize: 16, lineHeight: 24, marginBottom: SIZES.space.xs },
  fieldLabel: { fontFamily: FONTS.family.regular, fontSize: 12, lineHeight: 20, flex: 0.8 },
  fieldValue: { fontFamily: FONTS.family.medium, fontSize: 14, lineHeight: 22, flex: 1.2, textAlign: 'right' },
  card: { marginBottom: SIZES.space.lg, padding: SIZES.space.lg },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: SIZES.space.md, gap: SIZES.space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.borderSubtle },
  loading: { padding: SIZES.space.lg },
  retry: { alignSelf: 'flex-start', paddingVertical: SIZES.space.sm },
  input: { marginTop: SIZES.space.lg },
  actions: { gap: SIZES.space.sm, padding: SIZES.space.lg, backgroundColor: COLORS.surface, borderRadius: SIZES.radius.card, borderWidth: 1, borderColor: COLORS.borderSubtle },
  hero: { marginBottom: SIZES.space.lg, gap: SIZES.space.lg, backgroundColor: COLORS.brandTint },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.md },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.md, marginBottom: SIZES.space.sm },
  groupIcon: { width: 40, height: 40, borderRadius: SIZES.radius.md, backgroundColor: COLORS.brandTint, alignItems: 'center', justifyContent: 'center' },
  genderRow: { flexDirection: 'row', gap: SIZES.space.sm, marginTop: SIZES.space.sm },
  gender: { flex: 1, minHeight: 48, borderRadius: SIZES.radius.control, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  selected: { borderColor: COLORS.borderBrand, backgroundColor: COLORS.brandTint },
  selector: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.sm, minHeight: 52, padding: SIZES.space.md, marginTop: SIZES.space.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius.field, backgroundColor: COLORS.fieldBackground },
  postalStatus: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.sm, marginTop: SIZES.space.sm },
  officeList: { marginTop: SIZES.space.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius.md, overflow: 'hidden' },
  officeOption: { flexDirection: 'row', alignItems: 'center', minHeight: 48, padding: SIZES.space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.borderSubtle },
});
