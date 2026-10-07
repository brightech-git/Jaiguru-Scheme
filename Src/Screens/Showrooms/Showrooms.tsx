import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../Components/PremiumBackground/PremiumBackground';
import { AppCard, AppText } from '../../Components/ui/appcomponents';
import { TextInput } from '../../Components/Typography/FontText';
import { COLORS, SIZES, FONTS } from '../../Utills/AppTheme';
import ShowroomMap from './ShowroomMap';
import { SHOWROOMS, rankShowrooms, directionsUrl, type Coordinates } from './showroomData';

async function openLink(url: string, action: string) {
  try { await Linking.openURL(url); }
  catch { Alert.alert('Unable to open', `Could not open ${action} on this device. Please try again.`); }
}

export default function ShowroomsScreen() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [nearestOnly, setNearestOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [city, setCity] = useState('All cities');
  const [cityOpen, setCityOpen] = useState(false);
  const [search, setSearch] = useState('');
  const mounted = useRef(true);
  const locatingRef = useRef(false);
  const mapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<ScrollView>(null);
  const cardPositions = useRef<Record<string, number>>({});

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (mapTimer.current) clearTimeout(mapTimer.current);
    };
  }, []);

  const ranked = useMemo(() => location ? rankShowrooms(location) : SHOWROOMS.map((branch) => ({ ...branch, distance: null })), [location]);
  const nearest = location ? ranked[0] : null;
  const filteredBranches = useMemo(() => SHOWROOMS.filter((branch) =>
    (city === 'All cities' || branch.city === city) &&
    `${branch.name} ${branch.city} ${branch.address}`.toLowerCase().includes(search.trim().toLowerCase())
  ), [city, search]);
  const cards = ranked.filter((branch) => filteredBranches.some((item) => item.id === branch.id) && (!nearestOnly || branch.id === nearest?.id));

  const locate = useCallback(async (prompt = true, showNearest = true) => {
    if (locatingRef.current) return;
    locatingRef.current = true;
    setLocating(true); setLocationError(''); setPermissionBlocked(false);
    try {
      const permission = prompt ? await Location.requestForegroundPermissionsAsync() : await Location.getForegroundPermissionsAsync();
      if (!mounted.current) return;
      if (!permission.granted) {
        if (prompt) {
          setPermissionBlocked(!permission.canAskAgain);
          setLocationError('Allow location access to find your nearest showroom. All branches are still available below.');
        }
        return;
      }
      if (!await Location.hasServicesEnabledAsync()) throw new Error('Turn on your device location services and try again.');
      // A bounded request avoids leaving the screen waiting indefinitely for GPS.
      const result = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => {
          mapTimer.current = setTimeout(() => reject(new Error('Could not get your location. Move to an open area and try again.')), 15000);
        }),
      ]);
      if (!mounted.current) return;
      const point = { latitude: result.coords.latitude, longitude: result.coords.longitude };
      setLocation(point);
      if (showNearest) {
        setCity('All cities'); setSearch(''); setNearestOnly(true);
        setSelectedId(rankShowrooms(point)[0].id);
        listRef.current?.scrollTo({ y: 0, animated: true });
      }
    } catch (error: any) {
      if (mounted.current) setLocationError(error?.message || 'Unable to get your location. Please try again.');
    } finally {
      if (mapTimer.current) clearTimeout(mapTimer.current);
      locatingRef.current = false;
      if (mounted.current) setLocating(false);
    }
  }, []);

  // Show the user dot automatically when permission was granted previously.
  useEffect(() => { locate(false, false); }, [locate]);

  const selectBranch = (id: string) => {
    setNearestOnly(false); setSelectedId(id);
    requestAnimationFrame(() => listRef.current?.scrollTo({ y: cardPositions.current[id] || 0, animated: true }));
  };

  return (
    <View style={styles.root}>
      <PremiumBackground />
      <CommonHeader title="Store Locator" showBack transparent borderBottom={false} shadow={false} />
      <SafeAreaView edges={['bottom']} style={styles.body}>
        <ScrollView ref={listRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <AppText variant="h4" color={COLORS.brand} align="center">Find a Jai Guru showroom</AppText>
          <AppText variant="captionBold" color={COLORS.contentSecondary} align="center" style={styles.intro}>Find the nearest showroom to you</AppText>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: nearestOnly, disabled: locating }} disabled={locating} onPress={() => locate()} style={[styles.action, nearestOnly && styles.activeAction]}>
              {locating ? <ActivityIndicator color={COLORS.contentOnBrand} /> : <MaterialCommunityIcons name="crosshairs-gps" size={22} color={COLORS.contentOnBrand} />}
              <AppText variant="captionBold" color={COLORS.contentOnBrand} align="center" style={styles.actionText}>{locating ? 'Finding location...' : 'Nearest Showroom'}</AppText>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: !nearestOnly }} onPress={() => { setNearestOnly(false); setCity('All cities'); setSearch(''); setSelectedId(null); }} style={[styles.action, !nearestOnly && styles.activeAction]}>
              <MaterialCommunityIcons name="storefront-outline" size={22} color={COLORS.contentOnBrand} />
              <AppText variant="captionBold" color={COLORS.contentOnBrand} align="center" style={styles.actionText}>View All Showrooms</AppText>
            </Pressable>
          </View>
          {locationError ? <View style={styles.notice}>
            <AppText variant="captionBold" color={COLORS.contentSecondary}>{locationError}</AppText>
            <Pressable accessibilityRole="button" onPress={() => permissionBlocked ? Linking.openSettings().catch(() => Alert.alert('Settings unavailable', 'Enable location access in your device settings.')) : locate()} style={styles.retry}>
              <AppText variant="captionBold" color={COLORS.brand}>{permissionBlocked ? 'Open Settings' : 'Try Again'}</AppText>
            </Pressable>
          </View> : !location && !locating ? <AppText variant="caption" color={COLORS.contentMuted} style={styles.hint}>Tap Nearest Showroom to use your current location.</AppText> : null}
          <View style={styles.search}>
            <MaterialCommunityIcons name="map-marker-outline" size={22} color={COLORS.contentMuted} />
            <TextInput value={search} onChangeText={(value) => { setSearch(value); setNearestOnly(false); setSelectedId(null); }} placeholder="Search Jai Guru showrooms" placeholderTextColor={COLORS.contentPlaceholder} accessibilityLabel="Search showrooms" style={styles.searchInput} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Select city" accessibilityState={{ expanded: cityOpen }} onPress={() => setCityOpen((value) => !value)} style={styles.citySelect}>
            <AppText variant="captionBold">{city === 'All cities' ? 'Select City ? All cities' : city}</AppText>
            <MaterialCommunityIcons name={cityOpen ? 'chevron-up' : 'chevron-down'} size={22} color={COLORS.contentSecondary} />
          </Pressable>
          {cityOpen && <View style={styles.cityOptions}>{['All cities', 'Tiruvallur', 'Tiruttani'].map((name) => <Pressable key={name} accessibilityRole="button" onPress={() => { setCity(name); setCityOpen(false); setNearestOnly(false); setSelectedId(null); }} style={styles.cityOption}><AppText variant="captionBold" color={name === city ? COLORS.brand : COLORS.contentPrimary}>{name}</AppText></Pressable>)}</View>}
          {filteredBranches.length ? <ShowroomMap branches={filteredBranches} location={location} nearestId={nearest?.id} selectedId={selectedId} onSelect={selectBranch} onLocate={() => locate()} /> : <AppCard><AppText variant="captionBold">No showrooms match your search. Try another city or showroom name.</AppText></AppCard>}
          {nearest && <View style={styles.nearestSummary}>
            <MaterialCommunityIcons name="map-marker-check-outline" size={22} color={COLORS.brand} />
            <View style={styles.copy}><AppText variant="caption" color={COLORS.contentSecondary}>Nearest to your current location</AppText><AppText variant="bodyBold" color={COLORS.brand}>{nearest.name}</AppText><AppText variant="caption" color={COLORS.contentMuted}>{nearest.distance?.toFixed(1)} km away ? straight-line distance</AppText></View>
          </View>}
          <AppText variant="bodyBold" style={styles.listTitle}>{nearestOnly ? 'Your Nearest Showroom' : `Available Showrooms (${cards.length})`}</AppText>
          {cards.map((branch) => <View key={branch.id} onLayout={({ nativeEvent }) => { cardPositions.current[branch.id] = nativeEvent.layout.y; }}>
            <AppCard style={[styles.card, selectedId === branch.id && styles.selectedCard]}>
              <View style={styles.heading}>
                <View style={styles.icon}><MaterialCommunityIcons name="storefront-outline" size={24} color={COLORS.brand} /></View>
                <View style={styles.copy}><AppText variant="captionBold" color={COLORS.contentMuted}>{branch.order}{nearest?.id === branch.id ? ' ? Nearest' : ''}</AppText><AppText variant="bodyBold" color={COLORS.brand}>{branch.name}</AppText></View>
              </View>
              {branch.distance !== null && <AppText variant="captionBold" color={COLORS.contentSecondary} style={styles.distance}>{branch.distance.toFixed(1)} km away ? straight-line distance</AppText>}
              <AppText variant="captionBold" color={COLORS.contentSecondary} style={styles.address}>{branch.address}</AppText>
              <Pressable accessibilityRole="link" accessibilityLabel={`Get directions to ${branch.name}`} onPress={() => openLink(directionsUrl(branch, location), 'Google Maps')} style={styles.mapButton}><MaterialCommunityIcons name="navigation-variant-outline" size={20} color={COLORS.contentOnBrand} /><AppText variant="buttonSmall" color={COLORS.contentOnBrand}>Get Directions</AppText><MaterialCommunityIcons name="open-in-new" size={16} color={COLORS.contentOnBrand} /></Pressable>
              <View style={styles.branchActions}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Show ${branch.name} on the map`} onPress={() => { setSelectedId(branch.id); listRef.current?.scrollTo({ y: 0, animated: true }); }} style={styles.smallAction}><MaterialCommunityIcons name="map-marker-outline" size={18} color={COLORS.brand} /><AppText variant="captionBold" color={COLORS.brand}>Show on Map</AppText></Pressable>
                <Pressable accessibilityRole="link" accessibilityLabel={`Call ${branch.name} at ${branch.phone}`} onPress={() => openLink(`tel:${branch.phone}`, 'the phone dialer')} style={styles.smallAction}><MaterialCommunityIcons name="phone-outline" size={18} color={COLORS.brand} /><AppText variant="captionBold" color={COLORS.brand}>{branch.phone}</AppText></Pressable>
              </View>
            </AppCard>
          </View>)}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surfacePage }, body: { flex: 1 }, content: { padding: SIZES.space.gutter },
  intro: { marginTop: SIZES.space.xs, marginBottom: SIZES.space.lg },
  actions: { flexDirection: 'row', gap: SIZES.space.sm, marginBottom: SIZES.space.md },
  action: { flex: 1, minHeight: 70, backgroundColor: COLORS.brand, borderRadius: SIZES.radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SIZES.space.sm, gap: SIZES.space.xs, borderWidth: 2, borderColor: COLORS.brand },
  activeAction: { borderColor: COLORS.accentDeep }, actionText: { flexShrink: 1 },
  search: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.sm, marginBottom: SIZES.space.sm, minHeight: 48 },
  searchInput: { flex: 1, fontFamily: FONTS.family.semiBold, fontSize: 14, paddingVertical: SIZES.space.sm, color: COLORS.contentPrimary },
  citySelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.borderStrong, padding: SIZES.space.md, borderRadius: SIZES.radius.md, marginBottom: SIZES.space.md, backgroundColor: COLORS.surface },
  cityOptions: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.md, marginBottom: SIZES.space.md, borderWidth: 1, borderColor: COLORS.border }, cityOption: { padding: SIZES.space.md },
  notice: { backgroundColor: COLORS.warningSurface, borderRadius: SIZES.radius.md, padding: SIZES.space.md, marginBottom: SIZES.space.sm }, retry: { paddingTop: SIZES.space.sm }, hint: { marginBottom: SIZES.space.sm },
  nearestSummary: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.sm, padding: SIZES.space.md, backgroundColor: COLORS.accentSoft, borderRadius: SIZES.radius.md, marginBottom: SIZES.space.md },
  listTitle: { marginVertical: SIZES.space.md }, card: { marginBottom: SIZES.space.lg }, selectedCard: { borderColor: COLORS.brand, borderWidth: 1.5 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.md },
  icon: { width: 44, height: 44, borderRadius: SIZES.radius.md, backgroundColor: COLORS.brandAlpha08, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 },
  address: { marginVertical: SIZES.space.md, lineHeight: 23 }, distance: { marginTop: SIZES.space.sm },
  mapButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.space.sm, padding: SIZES.space.md, borderRadius: SIZES.radius.md, backgroundColor: COLORS.brand },
  branchActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: SIZES.space.xs, marginTop: SIZES.space.sm }, smallAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: SIZES.space.xs, paddingVertical: SIZES.space.sm },
});
