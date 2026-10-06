// screens/HomeScreen.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialIcons";
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
import GoldParticles from "../Auth/Login/components/GoldParticles";
import HomeHeader from "./components/HomeHeader";
import { useCompany } from "../../api/hooks/Company/useCompany";

const { COLORS, FONTS, SIZES, moderateScale } = theme;
const { width, height } = Dimensions.get("window");

const BG_GRADIENT = COLORS.gradient.accentWash as [string, string, string];

/** Premium section header with a gold accent bar. */
const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionBar} />
    <Text style={styles.sectionTitle}>{title}</Text>
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
            color={COLORS.contentBrand}
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
        <GoldParticles width={width} height={height} />
      </View>

      <ScreenWrapper
        scroll
        backgroundColor="transparent"
        statusBarStyle="dark-content"
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

        <SectionHeader title="Our Schemes" />
        <SchemesList />
        <View style={styles.sliderWrap}>
          <SliderComponent />
        </View>
        <SchemeDetailsCard />

        <SectionHeader title="Promotions & Updates" />
        <View style={styles.youtubeWrapper}>
          <MainPageWithYouTube />
        </View>

        <SectionHeader title="Need Help?" />
        <NeedHelpCard />

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

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.space.gutter,
    marginTop: SIZES.space.lg,
    marginBottom: SIZES.space.sm,
  },
  sectionBar: {
    width: moderateScale(4),
    height: moderateScale(18),
    borderRadius: 2,
    backgroundColor: COLORS.brand,
    marginRight: SIZES.space.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.xl,
    color: COLORS.contentPrimary,
  },

  // Help card
  helpCard: {
    marginHorizontal: SIZES.space.gutter,
    borderRadius: SIZES.radius.xl,
    backgroundColor: COLORS.whiteAlpha90,
    borderWidth: 1,
    borderColor: COLORS.brandAlpha16,
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
    backgroundColor: COLORS.brandAlpha16,
    alignItems: "center",
    justifyContent: "center",
  },
  helpTitle: {
    fontFamily: FONTS.family.semiBold,
    fontSize: SIZES.text.lg,
    color: COLORS.contentPrimary,
  },
  helpSubtitle: {
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.sm,
    color: COLORS.contentSecondary,
    marginTop: moderateScale(2),
    lineHeight: SIZES.text.sm * 1.5,
  },
  helpLink: { color: COLORS.contentBrand, fontFamily: FONTS.family.semiBold },

  youtubeWrapper: {
    marginHorizontal: SIZES.space.gutter,
    borderRadius: SIZES.radius.card,
    overflow: "hidden",
    backgroundColor: COLORS.black,
    ...theme.ELEVATION.floating,
  },
});
