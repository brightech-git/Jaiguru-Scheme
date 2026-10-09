import { Text } from '../../Components/Typography/FontText';
// Src/Screens/HelpCenter/HelpCenter.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Image, Linking, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { companyService } from '../../api/services/companyService';
import { branchService, Branch } from '../../api/services/branchService';
import { Company } from '../../types/Company/Company';
import { API_BASE_URL, IMAGE_BASE_URL } from '../../Config/BaseUrl';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../Components/PremiumBackground/PremiumBackground';
import BottomTab from '../../Components/BottomTab/BottomTab';
import theme from '../../Utills/AppTheme';

const { COLORS, SIZES, FONTS, ELEVATION } = theme;

// ─── Helpers ────────────────────────────────────────────────────────────────

const trimObject = (obj: Company): Company =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])) as Company;

const resolveLogoUrl = (c: Company): string => {
  if (c.CompanyLogoUrl?.startsWith('http')) return c.CompanyLogoUrl;
  if (c.LOGO?.startsWith('http')) return c.LOGO;
  if (c.BASEURL && c.LOGO) {
    const base = c.BASEURL.replace(/\/$/, '');
    const path = c.LOGO.startsWith('/') ? c.LOGO : `/${c.LOGO}`;
    return `${base}${path}`;
  }
  if (c.LOGO) {
    const path = c.LOGO.startsWith('/') ? c.LOGO : `/${c.LOGO}`;
    return `${IMAGE_BASE_URL}${path}`;
  }
  return `${API_BASE_URL}/uploads/companyLogo/default-logo.png`;
};

const openUrl = (url?: string | null) => url?.trim() && Linking.openURL(url);
const openPhone = (phone: string) => Linking.openURL(`tel:${phone}`);
const openEmail = (email: string) => Linking.openURL(`mailto:${email}`);
const openMaps = (addr: string) => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(addr)}`);

// ─── Entrance animation wrapper ─────────────────────────────────────────────
// Small fade + slide-up used to stagger each section in on mount.
const FadeInUp = ({ delay = 0, children, style }: { delay?: number; children: React.ReactNode; style?: any }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ─── Sub-components ─────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: string;
  label: string;
  value?: string | null;
  onPress?: (() => void) | undefined;
  isLink?: boolean;
  multiline?: boolean;
}

const InfoRow = ({ icon, label, value, onPress, isLink, multiline }: InfoRowProps) => {
  if (!value) return null;
  return (
    <TouchableOpacity style={styles.infoRow} onPress={onPress ?? undefined} disabled={!onPress} activeOpacity={onPress ? 0.65 : 1}>
      <View style={styles.iconBox}>
        <Icon name={icon} size={20} color={COLORS.contentBrand} />
      </View>
      <View style={[styles.infoContent, multiline ? { paddingVertical: 2 } : undefined]}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, isLink && styles.linkText]} numberOfLines={multiline ? undefined : 1} ellipsizeMode="tail">
          {value}
        </Text>
      </View>
      {onPress && <Icon name="chevron-right" size={18} color={COLORS.contentBrand} />}
    </TouchableOpacity>
  );
};

interface SocialButtonProps {
  iconName: string;
  link?: string | null;
  label: string;
}

const SocialButton = ({ iconName, link, label }: SocialButtonProps) => {
  if (!link) return null;
  return (
    <TouchableOpacity style={styles.socialBtn} onPress={() => openUrl(link)} activeOpacity={0.75}>
      <MaterialCommunityIcons name={iconName as any} size={22} color={COLORS.contentBrand} />
      <Text style={styles.socialBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const AppStoreButton = ({ iconName, link, label }: SocialButtonProps) => {
  if (!link) return null;
  return (
    <TouchableOpacity style={styles.appButton} onPress={() => openUrl(link)} activeOpacity={0.75}>
      <MaterialCommunityIcons name={iconName as any} size={20} color={COLORS.contentBrand} />
      <Text style={styles.appButtonText}>{label}</Text>
    </TouchableOpacity>
  );
};

// NOTE: `visible` is now computed explicitly by the caller from the actual
// data fields, instead of being inferred from `children`. Inspecting
// `children` doesn't work here because a child like `<InfoRow value={null} />`
// is still a truthy React element even though InfoRow renders `null` — so the
// old check always thought every section "had content" and showed empty
// section headers when a company had no data for that section.
const SectionWrapper = ({
  title,
  delay,
  visible,
  children,
}: {
  title: string;
  delay: number;
  visible: boolean;
  children: React.ReactNode;
}) => {
  if (!visible) return null;
  return (
    <FadeInUp delay={delay} style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </FadeInUp>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const HelpCentreScreen = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  const handleBackPress = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainDrawer');
  };

  const fetchCompanyDetails = useCallback(async () => {
    try {
      const [companyResult, branchResult] = await Promise.allSettled([
        companyService.getAll(),
        branchService.getAll(),
      ]);
      if (branchResult.status === 'fulfilled' && Array.isArray(branchResult.value)) {
        const cleanedBranches = branchResult.value.map(branch =>
          Object.fromEntries(Object.entries(branch).map(([key, value]) =>
            [key, typeof value === 'string' ? value.trim() : value]
          )) as unknown as Branch
        );
        setBranches(cleanedBranches
          .filter(branch => branch.active?.toUpperCase() !== 'N')
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
        setBranchError(null);
      } else {
        setBranchError('Unable to load branches. Tap to retry.');
      }
      if (companyResult.status === 'rejected') throw companyResult.reason;
      const data = companyResult.value;
      if (!Array.isArray(data) || data.length === 0) throw new Error('No company data found');

      const cleaned = trimObject(data[0]);
      setCompany({ ...cleaned, CompanyLogoUrl: resolveLogoUrl(cleaned) });
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch company details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyDetails();
  }, [fetchCompanyDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompanyDetails();
  };

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.contentBrand} />
        <Text style={styles.loadingText}>Loading company details…</Text>
      </View>
    );
  }

  // ── Error ──
  if (!company) {
    return (
      <View style={styles.center}>
        <Icon name="error-outline" size={52} color={COLORS.danger} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMsg}>{error || 'Company details not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchCompanyDetails} activeOpacity={0.85}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Derived values ──
  const fullAddress = [company.ADDRESS1, company.ADDRESS2, company.ADDRESS3].filter(Boolean).join(', ');
  const cityStateZip = [company.ADDRESS4, company.AREACODE].filter(Boolean).join(' – ');
  const addressDisplay = [fullAddress, cityStateZip].filter(Boolean).join('\n') || null;

  const isActive = company.ACTIVE === 'Y';

  // ── Explicit section visibility (fixes the "empty section header" bug) ──
  const hasContact = Boolean(company.PHONE || company.EMAIL || addressDisplay);

  const hasTax = Boolean(
    company.GSTNO ||
      company.PANNO ||
      company.TINNO ||
      company.TANNO ||
      company.TDSNO ||
      company.CSTNO ||
      company.LOCALTAXNO
  );

  const hasSocial = Boolean(
    company.FACEBOOKLINK || company.TWITTERLINK || company.INSTALINK || company.YOUTUBELINK || company.WHATSAPPLINK
  );
  const hasApps = Boolean(company.ANDROIDLINK || company.APPSTORELINK);
  const hasDigital = Boolean(company.BASEURL || hasSocial || hasApps || company.GOOGLEBUSINESSLINK);

  return (
    <SafeAreaView style={styles.container}>
      <PremiumBackground />
      <CommonHeader title="Help Center" showBack onBackPress={handleBackPress} transparent borderBottom={false} shadow={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.contentBrand} />}
      >
        {!!error && (
          <TouchableOpacity onPress={onRefresh} style={styles.infoRow} accessibilityRole="button">
            <Text style={styles.errorMsg}>Unable to refresh company details. Tap to retry.</Text>
          </TouchableOpacity>
        )}
        {/* ── Hero Banner ── */}
        <LinearGradient
          colors={[COLORS.brand, COLORS.brandStrong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroIconWrap}>
            <MaterialCommunityIcons name="headset" size={26} color={COLORS.contentOnBrand} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSubtitle}>Reach us, or explore everything about the company below</Text>
        </LinearGradient>

        {/* ── Company Card ── */}
        <FadeInUp delay={60} style={styles.companyCard}>
          <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="contain" />

          {company.COMPANYNAME ? <Text style={styles.companyName}>{company.COMPANYNAME}</Text> : null}

          {/* <View style={styles.metaRow}>
            {company.COMPANYID ? <Text style={styles.metaText}>ID: {company.COMPANYID}</Text> : null}
            {company.COMPANYID && company.COSTID ? <Text style={styles.metaDivider}>·</Text> : null}
            {company.COSTID ? <Text style={styles.metaText}>{company.COSTID}</Text> : null}
          </View> */}

          {/* <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
            <View style={[styles.badgeDot, { backgroundColor: isActive ? COLORS.success : COLORS.danger }]} />
            <Text style={styles.badgeText}>{isActive ? 'Active' : 'Inactive'}</Text>
          </View> */}
        </FadeInUp>

        {/* ── Contact ── */}
        <SectionWrapper title="📞 Contact Information" delay={110} visible={hasContact}>
          <InfoRow icon="phone" label="Phone" value={company.PHONE} onPress={company.PHONE ? () => openPhone(company.PHONE!) : undefined} isLink />
          <InfoRow icon="email" label="Email" value={company.EMAIL} onPress={company.EMAIL ? () => openEmail(company.EMAIL!) : undefined} isLink />
          <InfoRow
            icon="location-on"
            label="Address"
            value={addressDisplay}
            onPress={addressDisplay ? () => openMaps(addressDisplay) : undefined}
            isLink
            multiline
          />
        </SectionWrapper>

        <SectionWrapper title="Our Branches" delay={140} visible>
          {branchError && (
            <TouchableOpacity onPress={onRefresh} style={styles.infoRow} accessibilityRole="button">
              <Text style={styles.errorMsg}>{branchError}</Text>
            </TouchableOpacity>
          )}
          {!branchError && branches.length === 0 && (
            <Text style={[styles.infoValue, { padding: SIZES.space.lg }]}>No branch addresses available.</Text>
          )}
          {branches.map((branch, index) => {
            const address = [branch.address1, branch.address2, branch.address3, branch.address4, branch.areaCode]
              .filter(Boolean).join('\n');
            return (
              <View key={`${branch.companyId}-${index}`}>
                <Text style={[styles.sectionTitle, { fontSize: 14 }]}>
                  {branch.address2 || `Branch ${index + 1}`}
                </Text>
                <InfoRow icon="location-on" label="Address" value={address || 'Address unavailable'}
                  onPress={address ? () => openMaps(address.replace(/\n/g, ', ')) : undefined} isLink={!!address} multiline />
                <InfoRow icon="phone" label="Phone" value={branch.phone} onPress={branch.phone ? () => openPhone(branch.phone!) : undefined} isLink />
                <InfoRow icon="email" label="Email" value={branch.email} onPress={branch.email ? () => openEmail(branch.email!) : undefined} isLink multiline />
              </View>
            );
          })}
        </SectionWrapper>

        {/* ── Tax ── */}
        <SectionWrapper title="💰 Tax Information" delay={160} visible={hasTax}>
          <InfoRow icon="qr-code" label="GST No" value={company.GSTNO} />
          <InfoRow icon="assignment" label="PAN No" value={company.PANNO} />
          <InfoRow icon="local-offer" label="TIN No" value={company.TINNO} />
          <InfoRow icon="receipt" label="TAN No" value={company.TANNO} />
          <InfoRow icon="local-atm" label="TDS No" value={company.TDSNO} />
          <InfoRow icon="confirmation-number" label="CST No" value={company.CSTNO} />
          <InfoRow icon="local-taxi" label="Local Tax No" value={company.LOCALTAXNO} />
        </SectionWrapper>

        {/* ── Digital Presence ── */}
        <SectionWrapper title="🌐 Digital Presence" delay={210} visible={hasDigital}>
          <InfoRow
            icon="language"
            label="Website"
            value={company.BASEURL ? company.BASEURL.replace(/^https?:\/\//, '') : null}
            onPress={company.BASEURL ? () => openUrl(company.BASEURL) : undefined}
            isLink
          />

          {/* Social Media */}
          {hasSocial && (
            <View style={styles.socialSection}>
              <Text style={styles.subSectionLabel}>Social Media</Text>
              <View style={styles.socialGrid}>
                <SocialButton iconName="facebook" link={company.FACEBOOKLINK} label="Facebook" />
                <SocialButton iconName="twitter" link={company.TWITTERLINK} label="Twitter" />
                <SocialButton iconName="instagram" link={company.INSTALINK} label="Instagram" />
                <SocialButton iconName="youtube" link={company.YOUTUBELINK} label="YouTube" />
                <SocialButton iconName="whatsapp" link={company.WHATSAPPLINK} label="WhatsApp" />
              </View>
            </View>
          )}

          {/* App Store Links */}
          {hasApps && (
            <View style={styles.appSection}>
              <Text style={styles.subSectionLabel}>Mobile Apps</Text>
              <View style={styles.appRow}>
                <AppStoreButton iconName="google-play" link={company.ANDROIDLINK} label="Android App" />
                <AppStoreButton iconName="apple" link={company.APPSTORELINK} label="iOS App" />
              </View>
            </View>
          )}

          <InfoRow
            icon="business-center"
            label="Google Business"
            value={company.GOOGLEBUSINESSLINK ? 'View on Google Maps' : null}
            onPress={company.GOOGLEBUSINESSLINK ? () => openUrl(company.GOOGLEBUSINESSLINK) : undefined}
            isLink
          />
        </SectionWrapper>

        {/* ── Footer ── */}
        <FadeInUp delay={260} style={styles.footer}>
          <View style={styles.footerIconWrap}>
            <Icon name="support-agent" size={28} color={COLORS.contentBrand} />
          </View>
          <Text style={styles.footerTitle}>Need more help?</Text>
          <Text style={styles.footerSub}>Contact us through any of the channels above</Text>
        </FadeInUp>
      </ScrollView>
      <BottomTab activeScreen="SUPPORT" />
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const INDIGO_LIGHT = COLORS.accentSoft;
const SURFACE = COLORS.surface;
const BG = COLORS.surfaceMuted;
const TEXT_PRIMARY = COLORS.contentPrimary;
const TEXT_SECONDARY = COLORS.contentSecondary;
const BORDER = COLORS.border;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG, padding: 24 },

  // Loading / Error
  loadingText: { marginTop: 12, fontSize: 15, color: TEXT_SECONDARY },
  errorTitle: { marginTop: 16, fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY },
  errorMsg: { marginTop: 8, fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 20, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: COLORS.brand, borderRadius: 10, ...ELEVATION.brandGlow },
  retryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  // Hero
  heroBanner: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.3, textAlign: 'center' },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 6, textAlign: 'center', paddingHorizontal: 12 },

  // Company Card
  companyCard: {
    backgroundColor: SURFACE,
    marginHorizontal: 16,
    marginTop: -22,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    shadowColor: COLORS.shadowAccent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 12,
  },
  logo: { width: 100, height: 100, borderRadius: 50, backgroundColor: INDIGO_LIGHT },
  logoPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: INDIGO_LIGHT, justifyContent: 'center', alignItems: 'center' },
  companyName: { fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 12, textAlign: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 13, color: TEXT_SECONDARY },
  metaDivider: { fontSize: 13, color: TEXT_SECONDARY, marginHorizontal: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeActive: { backgroundColor: '#ECFDF5' },
  badgeInactive: { backgroundColor: '#FEF2F2' },
  badgeDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  badgeText: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: '500' },

  // Section
  section: { backgroundColor: SURFACE, marginHorizontal: 16, marginBottom: 12, paddingBottom: 4, borderRadius: 16, overflow: 'hidden', ...ELEVATION.raised },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    letterSpacing: 0.1,
  },

  // InfoRow
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: INDIGO_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 15, color: TEXT_PRIMARY, fontWeight: '500' },
  linkText: { color: COLORS.contentBrand },

  // Social
  socialSection: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  subSectionLabel: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY, marginBottom: 10 },
  socialGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: INDIGO_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  socialBtnLabel: { fontSize: 13, color: COLORS.contentBrand, fontWeight: '500' },

  // App buttons
  appSection: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14 },
  appRow: { flexDirection: 'row', gap: 10 },
  appButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: INDIGO_LIGHT,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  appButtonText: { color: COLORS.contentBrand, fontSize: 14, fontWeight: '500' },

  // Footer
  footer: {
    backgroundColor: SURFACE,
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
    ...ELEVATION.raised,
  },
  footerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: INDIGO_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerTitle: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY },
  footerSub: { fontSize: 13, color: TEXT_SECONDARY },
});

export default HelpCentreScreen;
