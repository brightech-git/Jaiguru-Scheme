import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../Components/PremiumBackground/PremiumBackground';
import { AppCard, AppText } from '../../Components/ui/appcomponents';
import { COLORS, SIZES } from '../../Utills/AppTheme';

const SHOWROOMS = [
  {
    order: '1st Showroom', name: 'Tiruvallur Showroom',
    address: '712, TNHB, Kakkalur Bye Pass Road,\nNear Old Collector Office,\nTiruvallur - 602001',
    phone: '9600972227',
    map: 'https://www.google.com/maps?q=Jai+Guru+Jewellers,+712,+kakkalur+bye+pass+Road,+near+Old+collector+office,+Tamil+Nadu+602001&ftid=0x3a52901f89b2edd9:0x31d61e505b551702&entry=gps',
  },
  {
    order: '2nd Showroom', name: 'Tiruttani Showroom',
    address: '321/322, Ma. Po. Si. Salai,\nOpp. to Tiruttani Railway Station,\nTiruttani, Tamil Nadu - 631209',
    phone: '9169161469',
    map: 'https://www.google.com/maps?q=Jai+Guru+Jewellers,+Railway+Station,+321/322+Ma.+Po.+Si+Salai,+Tiruttani,+opp.+to+Tiruttani,+Thiruttani,+Tamil+Nadu+631209&ftid=0x3a52a58d23e8180d:0x421a2bd04380b0f3&entry=gps',
  },
  {
    order: '3rd Showroom', name: 'JN Road Showroom',
    address: '10, JN Road, Near Satya Electronics,\nHariram Nagar, V.M Nagar,\nTiruvallur, Tamil Nadu - 602001',
    phone: '8220771862',
    map: 'https://www.google.com/maps?q=Jai+guru+Jewellers+-+JN+Road+Showroom,+10,+JN+Rd,+near+Satya+Electronics,+Hariram+Nagar,+V.M+Nagar,+Tiruvallur,+Tiruvaloor,+Tamil+Nadu+602001&ftid=0x3a52916868828381:0x135c8d8820a894fe&entry=gps',
  },
];

async function openLink(url: string, action: string) {
  try { await Linking.openURL(url); }
  catch { Alert.alert('Unable to open', `Could not open ${action} on this device. Please try again.`); }
}

export default function ShowroomsScreen() {
  return (
    <View style={styles.root}>
      <PremiumBackground />
      <CommonHeader title="Our Showrooms" showBack transparent borderBottom={false} shadow={false} />
      <SafeAreaView edges={['bottom']} style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppText variant="bodySmall" color={COLORS.contentSecondary} style={styles.intro}>Visit a Jai Guru showroom. View the location on Google Maps or call the showroom directly.</AppText>
          {SHOWROOMS.map((showroom) => (
            <AppCard key={showroom.name} style={styles.card}>
              <View style={styles.heading}>
                <View style={styles.icon}><MaterialCommunityIcons name="storefront-outline" size={24} color={COLORS.brand} /></View>
                <View style={styles.copy}>
                  <AppText variant="caption" color={COLORS.contentMuted}>{showroom.order}</AppText>
                  <AppText variant="bodyBold" color={COLORS.brand}>{showroom.name}</AppText>
                </View>
              </View>
              <AppText variant="bodySmall" color={COLORS.contentSecondary} style={styles.address}>{showroom.address}</AppText>
              <Pressable accessibilityRole="link" accessibilityLabel={`View ${showroom.name} on map`} onPress={() => openLink(showroom.map, 'Google Maps')} style={styles.mapButton}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.contentOnBrand} />
                <AppText variant="buttonSmall" color={COLORS.contentOnBrand}>View on Map</AppText>
                <MaterialCommunityIcons name="open-in-new" size={16} color={COLORS.contentOnBrand} />
              </Pressable>
              <Pressable accessibilityRole="link" accessibilityLabel={`Call ${showroom.name} at ${showroom.phone}`} onPress={() => openLink(`tel:${showroom.phone}`, 'the phone dialer')} style={styles.callButton}>
                <MaterialCommunityIcons name="phone-outline" size={19} color={COLORS.brand} />
                <AppText variant="bodyMedium" color={COLORS.brand}>{showroom.phone}</AppText>
              </Pressable>
            </AppCard>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surfacePage },
  body: { flex: 1 },
  content: { padding: SIZES.space.gutter },
  intro: { marginBottom: SIZES.space.lg },
  card: { marginBottom: SIZES.space.lg },
  heading: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.md },
  icon: { width: 44, height: 44, borderRadius: SIZES.radius.md, backgroundColor: COLORS.brandAlpha08, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  address: { marginVertical: SIZES.space.lg, lineHeight: 23 },
  mapButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.space.sm, padding: SIZES.space.md, borderRadius: SIZES.radius.md, backgroundColor: COLORS.brand },
  callButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.space.sm, padding: SIZES.space.sm, marginTop: SIZES.space.sm },
});
