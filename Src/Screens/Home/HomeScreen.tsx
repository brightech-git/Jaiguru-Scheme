import { Text } from '../../Components/Typography/FontText';
// screens/HomeScreen.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getUserData } from "../../Utills/AsynchStorageHelper";
import useNotifications from "../../api/hooks/Notifications/useNotifications";
import type { CustomerProfile } from "./components/homeHeaderData";
import SchemeDetailsCard from "../../Components/SchemeDetailsCard/SchemeDetailsCard";
import theme from "../../Utills/AppTheme";
import { ratesService } from "../../api/services/ratesService";
import type { Rates } from "../../types/Rates/Rates";
import SliderComponent from "../../Components/Slider/Slider";
import SchemesList from "../../Components/SchemeCard/SchemeCard";
import { deviceService } from "../../api/services/deviceService";
import { getFCMToken } from "../../Helpers/NotificationHelper";
import BottomTab from "../../Components/BottomTab/BottomTab";
import MainPageWithYouTube from "../../Components/Youtube/Youtube";
import { ScreenWrapper } from "../../Components/ui/appcomponents";
import HomeHeader from "./components/HomeHeader";
import HomeQuickActions from "./components/HomeQuickActions";
import ShowroomLocatorCard from "./components/ShowroomLocatorCard";
import { useCompany } from "../../api/hooks/Company/useCompany";

const { COLORS, FONTS, SIZES, moderateScale } = theme;

const BG_GRADIENT: [string, string, string] = [COLORS.surface, COLORS.accentTint, COLORS.surface];

const SectionHeader = ({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) => (
  <View style={styles.sectionHeader}>
    {!!eyebrow && <Text style={styles.sectionEyebrow}>{eyebrow}</Text>}
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionRule} />
      <MaterialCommunityIcons name="star-four-points" size={12} color={COLORS.accentDeep} />
    </View>
    {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
  </View>
);

const NeedHelpCard = () => {
  const { company } = useCompany();
  const phone = company?.PHONE || "";
  const email = company?.EMAIL || "";

  const callPhone = () => phone && Linking.openURL(`tel:${phone}`);
  const openEmail = () => email && Linking.openURL(`mailto:${email}`);

  return (
    <View style={styles.helpCard}>
      <View style={styles.helpHeader}>
        <View style={styles.helpIconWrap}>
          <MaterialCommunityIcons
            name="headset"
            size={moderateScale(22)}
            color={COLORS.accentDeep}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpSubtitle}>
            We're here to help anytime. Reach us at{" "}
            {phone ? (
              <Text onPress={callPhone} style={styles.helpLink}>
                {phone}
              </Text>
            ) : null}
            {phone && email ? " or " : null}
            {email ? (
              <Text onPress={openEmail} style={styles.helpLink}>
                {email}
              </Text>
            ) : null}
          </Text>
        </View>
      </View>
    </View>
  );
};

type NotificationStatus =
  | "checking"
  | "registering"
  | "registered"
  | "skipped"
  | "failed";

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);

  const [notificationStatus, setNotificationStatus] =
    useState<NotificationStatus>("checking");
  const [userId, setUserId] = useState<string | number | null>(null);
  const [profile, setProfile] = useState<CustomerProfile>({
    name: "",
    memberId: "",
  });
  const { unreadCount } = useNotifications();

  // ---- Live gold / silver rates (real API + pull-to-refresh) --------------
  const [rates, setRates] = useState<Rates | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState("");

  const fetchRates = useCallback(async () => {
    try {
      setRatesLoading(true);
      setRatesError(null);
      const data = await ratesService.getTodayRate();
      setRates(data);
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(data.GOLDRATEDATE || '');
      const date = match ? `${match[3]}-${match[2]}-${match[1]}` : data.GOLDRATEDATE;
      setRatesUpdatedAt([date, data.GOLDUPTIME].filter(Boolean).join(' | '));
    } catch (err: any) {
      setRatesError(err?.message || "Failed to fetch rates");
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  useEffect(() => {
    getUserData_();
  }, []);
  useEffect(() => {
    if (userId) handlePushNotificationRegistration();
  }, [userId]);

  const getUserData_ = async () => {
    try {
      const user = await getUserData();
      if (user) {
        setUserId(user.userId || user.userid);
        setProfile({
          name: user.username || user.name || "",
          memberId: String(user.userId || user.userid || ""),
          avatarUrl: user.picture || null,
        });
      } else {
        setNotificationStatus("skipped");
      }
    } catch {
      setNotificationStatus("failed");
    }
  };

  const handlePushNotificationRegistration = async () => {
    try {
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      setNotificationStatus("registering");
      await AsyncStorage.multiRemove(["pushToken", "tokenSentToServer"]);
      const token = await getFCMToken();
      if (token) await sendTokenToServer(token);
      else setNotificationStatus("failed");
    } catch {
      setNotificationStatus("failed");
    }
  };

  const sendTokenToServer = async (token: string) => {
    try {
      const success = await deviceService.registerDevice(token, userId ?? "");
      if (success) setNotificationStatus("registered");
      else setNotificationStatus("failed");
    } catch {
      setNotificationStatus("failed");
    }
  };

  return (
    <View style={styles.root}>
      {/* Full-bleed luxury background + floating particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
      </View>

      <ScreenWrapper
        scroll
        backgroundColor="transparent"
        statusBarStyle="light-content"
        statusBarBg="transparent"
        paddingHorizontal={0}
        paddingTop={0}
        paddingBottom={SIZES.space.md}
        edges={[]}
        footer={<BottomTab activeScreen="HOME" />}
      >
        {/* Premium curved gold header with greeting + summary cards */}
        <HomeHeader
          profile={profile}
          unreadCount={unreadCount}
          goldValue={rates?.GOLDRATE ?? null}
          silverValue={rates?.SILVERRATE ?? null}
          ratesLoading={ratesLoading}
          ratesError={ratesError}
          ratesUpdatedAt={ratesUpdatedAt}
          refreshingRate={ratesLoading}
          onRefreshRate={fetchRates}
          onProfilePress={() => navigation.navigate("Profile")}
          onNotificationsPress={() => navigation.navigate("NotificationScreen")}
          onSupportPress={() => navigation.navigate("HelpCenter")}
          onSettingsPress={() => navigation.navigate("Profile")}
          onScanPress={() => {}}
        />

        {/* {renderNotificationBanner()} */}

        {/* <HomeQuickActions onNavigate={(route) => navigation.navigate(route)} /> */}

        <SectionHeader eyebrow="MADE FOR YOUR TOMORROW" title="Your golden journey" subtitle="Explore a jewellery savings plan that fits you." />
        <SchemesList />
        <View style={styles.accountSection}>
          <SchemeDetailsCard />
        </View>
        <View style={styles.sliderWrap}>
          <SliderComponent />
        </View>
        



        <ShowroomLocatorCard onPress={() => navigation.navigate('Showrooms')} />

        <SectionHeader eyebrow="THE JAIGURU EDIT" title="Stories & collections" subtitle="Discover what is new in our world of jewellery." />
        <View style={styles.youtubeWrapper}>
          <MainPageWithYouTube />
        </View>

      
        <SectionHeader eyebrow="ALWAYS BY YOUR SIDE" title="A personal touch" />
        <NeedHelpCard />
        <View style={styles.brandFooter}>
          <MaterialCommunityIcons name="star-four-points" size={15} color={COLORS.accentDeep} />
          <Text style={styles.footerBrand}>JAIGURU JEWELLERS</Text>
          <Text style={styles.footerTagline}>Celebrate every golden moment.</Text>
        </View>

        <View style={{ height: moderateScale(8) }} />
      </ScreenWrapper>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surfacePage },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SIZES.space.gutter,
    marginTop: SIZES.space.md,
    marginBottom: SIZES.space.xs,
    paddingVertical: SIZES.space.sm,
    paddingHorizontal: SIZES.space.md,
    borderRadius: SIZES.radius.md,
    gap: SIZES.space.sm,
  },
  bannerLoading: { backgroundColor: COLORS.warning },
  bannerError: { backgroundColor: COLORS.danger },
  bannerText: { ...FONTS.bodySm, color: COLORS.contentOnBrand, flex: 1 },
  bannerAction: {
    ...FONTS.caption,
    color: COLORS.contentOnBrand,
    textDecorationLine: "underline",
    fontFamily: FONTS.family.semiBold,
  },

  sliderWrap: { marginTop: SIZES.space.lg },

  accountSection: { marginTop: SIZES.space.lg },
  sectionHeader: { paddingHorizontal: SIZES.space.gutter, marginTop: SIZES.space.xxxl, marginBottom: SIZES.space.lg },
  sectionEyebrow: { fontFamily: FONTS.family.semiBold, fontSize: 9, lineHeight: 15, letterSpacing: 1.5, color: COLORS.contentBrand, marginBottom: 6 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space.sm },
  sectionTitle: { fontFamily: FONTS.family.semiBold, fontSize: 22, lineHeight: 32, color: COLORS.brandDeep, flexShrink: 1 },
  sectionRule: { flex: 1, minWidth: 12, height: 1, backgroundColor: COLORS.accentStrong },
  sectionSubtitle: { fontFamily: FONTS.family.regular, fontSize: 11, lineHeight: 18, color: COLORS.contentMuted, marginTop: 4 },
  brandFooter: { alignItems: 'center', paddingTop: SIZES.space.xxxl, paddingBottom: SIZES.space.lg, gap: SIZES.space.sm },
  footerBrand: { fontFamily: FONTS.family.semiBold, fontSize: 11, letterSpacing: 2, color: COLORS.brand },
  footerTagline: { fontFamily: FONTS.family.regular, fontSize: 10, color: COLORS.contentMuted },

  // Help card
  helpCard: {
    marginHorizontal: SIZES.space.gutter,
    borderRadius: SIZES.radius.xl,
    backgroundColor: COLORS.brandDeep,
    borderWidth: 1,
    borderColor: COLORS.brandStrong,
    padding: SIZES.space.lg,
    ...theme.ELEVATION.raised,
  },
  helpHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.space.sm,
  },
  helpIconWrap: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.whiteAlpha10,
    alignItems: "center",
    justifyContent: "center",
  },
  helpTitle: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.lg,
    color: COLORS.accentTint,
  },
  helpSubtitle: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.sm,
    color: COLORS.whiteAlpha80,
    marginTop: moderateScale(2),
    lineHeight: SIZES.text.sm * 1.5,
  },
  helpLink: { color: COLORS.accentStrong, fontFamily: FONTS.family.semiBold },

  youtubeWrapper: {
    marginHorizontal: SIZES.space.gutter,
    borderRadius: SIZES.radius.card,
    overflow: "hidden",
    backgroundColor: COLORS.black,
    ...theme.ELEVATION.floating,
  },
});
