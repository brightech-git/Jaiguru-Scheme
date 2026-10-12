import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useCompany } from '../../../api/hooks/Company/useCompany';
import { getUserData } from '../../../Utills/AsynchStorageHelper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../Components/ui/appcomponents';
import { REVIEW_LOCATIONS, SOCIAL_CHANNELS } from '../../../constants/socialLinks';
import theme from '../../../Utills/AppTheme';

const { COLORS, SIZES } = theme;

export default function StayConnectedSection() {
  const [reviewVisible, setReviewVisible] = useState(false);
  const { company, loading, error } = useCompany();
  const openCompanyWhatsApp = async () => {
    // Use the first company phone when the API contains multiple numbers.
    const phone = company?.PHONE?.split(/[,;\/|\n]/)[0]?.trim() || '';
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length === 10) digits = `91${digits}`;
    if (!/^[1-9]\d{7,14}$/.test(digits)) {
      Alert.alert('WhatsApp unavailable', loading ? 'Company details are loading. Please try again shortly.' : 'A valid company phone number is not available.');
      return;
    }
    let name = '';
    try {
      const user = await getUserData();
      name = String(user?.customerName || user?.username || user?.name || '').trim();
    } catch {
      // The company chat is still available when stored user data cannot be read.
    }
    const greeting = name ? `Hi, this is ${name}. 👋` : 'Hi there! 👋';
    const message = `${greeting}\n\nGreetings to Jai Guru Jewellers! ✨\nI’m interested in your jewellery collections and savings schemes. Could you please share more details?`;
    const text = encodeURIComponent(message);
    try {
      await Linking.openURL(`whatsapp://send?phone=${digits}&text=${text}`);
    } catch {
      await openLink(`https://wa.me/${digits}?text=${text}`);
    }
  };
  const openLink = async (link?: string) => {
    const raw = link?.trim();
    if (!raw) {
      Alert.alert('Link unavailable', loading ? 'Social links are loading. Please try again shortly.' : error ? 'Unable to load social links. Please try again later.' : 'This social link has not been added yet.');
      return;
    }
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', 'Please try again.');
    }
  };
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <AppText variant="labelUppercase" color={COLORS.contentSecondary}>STAY CONNECTED</AppText>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {SOCIAL_CHANNELS.map(channel => (
          <Pressable key={channel.field} onPress={() => channel.field === 'WHATSAPPLINK' ? openCompanyWhatsApp() : channel.field === 'GOOGLEBUSINESSLINK' ? setReviewVisible(true) : openLink(channel.url)} accessibilityRole="button" accessibilityLabel={`Open ${channel.label}`} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.7 }]}>
            <View style={styles.tileBody}>
              {channel.field === 'GOOGLEBUSINESSLINK' ? (
                <View style={styles.icon1}>
                  <Image source={require('../../../Assets/Icons/google.png')} style={{ width: 26, height: 26 }} resizeMode="cover" />
                </View>
              ) : channel.field === 'INSTALINK' ? (
                <LinearGradient colors={['#833AB4', '#C13584', '#E1306C', '#F77737', '#FCAF45']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.icon}>
                  <MaterialCommunityIcons name="instagram" size={19} color="white" />
                </LinearGradient>
              ) : (
                <View style={[styles.icon, { backgroundColor: channel.color }]}><MaterialCommunityIcons name={channel.icon} size={19} color="white" /></View>
              )}
              <AppText variant="captionBold" style={styles.platform}>{channel.label}</AppText>
              <AppText variant="caption" color={COLORS.contentSecondary} style={styles.subtitle}>{channel.subtitle}</AppText>
            </View>
            <View style={[styles.tileFooter, { backgroundColor: `${channel.color}0D` }]}>
              <AppText variant="captionBold" color={channel.field === 'WHATSAPPLINK' ? '#187B3D' : channel.color} style={styles.action}>{channel.action}</AppText>
              <MaterialCommunityIcons name="arrow-right" size={15} color={channel.color} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <Modal visible={reviewVisible} transparent animationType="fade" onRequestClose={() => setReviewVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <AppText variant="h4">Review your showroom</AppText>
            <AppText variant="bodySmall" color={COLORS.contentSecondary}>Choose the Jai Guru Jewellers location you visited.</AppText>
            <ScrollView style={{ maxHeight: 300 }}>
              {REVIEW_LOCATIONS.map(location => (
                <Pressable key={location.name} disabled={!location.url} accessibilityRole="button" accessibilityState={{ disabled: !location.url }} onPress={() => { setReviewVisible(false); void openLink(location.url); }} style={styles.location}>
                  <MaterialCommunityIcons name="map-marker-outline" size={22} color={COLORS.contentBrand} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyBold">{location.name}</AppText>
                    <AppText variant="caption" color={COLORS.contentSecondary}>{location.url ? 'Write a Google review' : 'Review link coming soon'}</AppText>
                  </View>
                  {!!location.url && <MaterialCommunityIcons name="arrow-top-right" size={19} color={COLORS.contentBrand} />}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => setReviewVisible(false)} accessibilityRole="button" style={styles.close}><AppText variant="bodyBold" color={COLORS.contentBrand}>Close</AppText></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginHorizontal: SIZES.space.gutter, marginVertical: SIZES.space.xl },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.space.md },
  grid: { gap: SIZES.space.sm },
  tile: { width: 154, borderRadius: 12, overflow: 'hidden', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.borderSubtle },
  tileBody: { flexGrow: 1, padding: 12, gap: 4 },
  icon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  icon1: { width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  platform: { fontSize: 12, textTransform: 'none' },
  subtitle: { fontSize: 10, textTransform: 'none' },
  tileFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, minHeight: 44 },
  action: { flex: 1, fontSize: 10, textTransform: 'none' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SIZES.space.lg },
  dialog: { width: '100%', maxWidth: 440, alignSelf: 'center', maxHeight: '85%', padding: SIZES.space.lg, borderRadius: SIZES.radius.card, backgroundColor: COLORS.surface, gap: SIZES.space.md },
  location: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.space.md, gap: SIZES.space.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle },
  close: { alignItems: 'center', padding: SIZES.space.sm },
});
