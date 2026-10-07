// Src/Screens/Profile/Profile.tsx
//
// "Profile" tab — redesigned UI structure.
//
// What changed vs. the previous version (logic is identical, only layout):
//   - The old single gradient banner + one flat action list is replaced by:
//       1. A centered "hero" section: avatar inside a gradient ring, name
//          centered below it, contact details shown as small pill chips,
//          and the referral code pulled out into its own highlighted card.
//       2. The menu is now split into labeled sections (Account / Support /
//          Danger Zone) rendered as separate cards with section headers,
//          instead of one long undifferentiated list.
//       3. Logout is now a full-width outlined button, visually distinct
//          from the "Delete Account" danger-zone row above it.
//       4. Version + "Powered by" are merged into a single footer block
//          under a hairline divider.
import React, { useCallback, useState } from 'react';
import Constants from 'expo-constants';
import { View, ScrollView, Image, ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../Components/PremiumBackground/PremiumBackground';
import BottomTab from '../../Components/BottomTab/BottomTab';
import { AppText, AppCard } from '../../Components/ui/appcomponents';
import { getAuthSession, getUserData, getUserId, clearAuthData } from '../../Utills/AsynchStorageHelper';
import { clearFCMToken } from '../../Helpers/NotificationHelper';
import theme from '../../Utills/AppTheme';

const { COLORS, SIZES, ELEVATION } = theme;

interface ProfileUser {
  id: string | number | null;
  name: string;
  email: string;
  contactNumber: string;
  picture: string;
  referralCode: string;
  loginType: string;
}

const EMPTY_USER: ProfileUser = {
  id: null,
  name: '',
  email: '',
  contactNumber: '',
  picture: '',
  referralCode: '',
  loginType: '',
};

// Menu items are now grouped into labeled sections instead of one flat list.
interface MenuAction {
  key: string;
  label: string;
  icon: string;
  iconLib?: 'MaterialIcons' | 'Ionicons';
  iconColor?: string;
  bgColor?: string;
  danger?: boolean;
  onPress: (navigation: any) => void;
}

interface MenuSection {
  title: string;
  items: MenuAction[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Account',
    items: [
      {
        key: 'myprofile',
        label: 'My Profile',
        icon: 'person-outline',
        iconColor: COLORS.brand,
        bgColor: COLORS.brandAlpha16,
        onPress: (nav) => nav.navigate('MyProfile'),
      },
      {
        key: 'resetmpin',
        label: 'Reset MPIN',
        icon: 'lock-reset',
        iconLib: 'MaterialIcons',
        iconColor: COLORS.brand,
        bgColor: COLORS.brandAlpha16,
        onPress: (nav) => nav.navigate('ResetMPIN'),
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        key: 'help',
        label: 'Help & Support',
        icon: 'headset-mic',
        iconLib: 'MaterialIcons',
        iconColor: COLORS.info,
        bgColor: COLORS.infoSurface,
        onPress: (nav) => nav.navigate('HelpCenter'),
      },
      {
        key: 'privacy',
        label: 'Privacy Policy',
        icon: 'shield',
        iconLib: 'MaterialIcons',
        iconColor: COLORS.success,
        bgColor: COLORS.successSurface,
        onPress: (nav) => nav.navigate('PrivacyPolicy'),
      },
      {
        key: 'terms',
        label: 'Terms & Conditions',
        icon: 'description',
        iconLib: 'MaterialIcons',
        iconColor: COLORS.warning,
        bgColor: COLORS.warningSurface,
        onPress: (nav) => nav.navigate('TermsAndConditions'),
      },
    ],
  },
  {
    title: 'Danger Zone',
    items: [
      {
        key: 'deleteaccount',
        label: 'Delete Account',
        icon: 'delete-outline',
        iconLib: 'MaterialIcons',
        iconColor: COLORS.danger,
        bgColor: COLORS.dangerSurface,
        danger: true,
        onPress: (nav) => nav.navigate('DeleteAccount'),
      },
    ],
  },
];

const getAvatarColor = (name: string): string => {
  const colors = ['#2274D4', '#2A8448', '#EB0000', '#A16800', '#9B59B6', '#12846D', '#DF2E1B', '#207AB6', '#1E8549'];
  if (!name) return colors[0];
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return colors[Math.abs(hash) % colors.length];
};

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<ProfileUser>(EMPTY_USER);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const [userData, session, userId] = await Promise.all([getUserData(), getAuthSession(), getUserId()]);
      const info: Record<string, any> = userData || session?.user || {};
      setUser({
        id: info.userId ?? info.userid ?? info.id ?? userId,
        name: info.username || info.name || 'User',
        email: info.email || '',
        contactNumber: info.contactNumber || info.mobileNumber || '',
        picture: info.picture || '',
        referralCode: info.referralCode || '',
        loginType: info.loginType || 'normal',
      });
    } catch (e) {
      console.log('Failed to load profile user data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh whenever the tab regains focus (e.g. after coming back from
  // ResetMPIN) so any changes are reflected without a full app restart.
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearAuthData();
          // Local-only cleanup: the backend has no device-deactivation
          // endpoint yet, so this just stops treating the cached FCM token as
          // "already registered" — the next login will re-register it fresh.
          await clearFCMToken();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const renderSectionTitle = (title: string) => (
    <AppText variant="label" color={COLORS.contentMuted} style={styles.sectionTitle}>
      {title.toUpperCase()}
    </AppText>
  );

  return (
    <View style={styles.container}>
      <PremiumBackground />
      <CommonHeader title="My Profile" showBack={false} transparent borderBottom={false} shadow={false} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---------- Hero: centered avatar + name + contact chips ---------- */}
        <View style={styles.heroWrap}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.contentBrand} />
          ) : (
            <>
              <View style={styles.avatarCenterWrap}>
                <LinearGradient
                  colors={[COLORS.brand, COLORS.brandStrong]}
                  style={styles.avatarRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.avatarInner}>
                    {user.picture ? (
                      <Image source={{ uri: user.picture }} style={styles.avatarImage} />
                    ) : (
                      <View style={[styles.avatarFallback, { backgroundColor: getAvatarColor(user.name) }]}>
                        <AppText variant="h2" color={COLORS.contentOnBrand}>
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </AppText>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.nameRowCenter}>
                <AppText variant="h3" color={COLORS.contentPrimary} numberOfLines={1}>
                  {user.name}
                </AppText>
                {user.loginType === 'GOOGLE' && (
                  <MaterialIcons name="verified" size={16} color={COLORS.success} style={{ marginLeft: 6 }} />
                )}
              </View>

              {/* Contact info rows */}
              <View style={styles.infoCard}>
                {!!user.email && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconWrap}>
                      <MaterialIcons name="mail-outline" size={16} color={COLORS.brand} />
                    </View>
                    <AppText variant="bodySmall" color={COLORS.contentPrimary} numberOfLines={1} style={styles.infoText}>
                      {user.email}
                    </AppText>
                  </View>
                )}
                {!!user.email && !!user.contactNumber && <View style={styles.infoDivider} />}
                {!!user.contactNumber && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconWrap}>
                      <MaterialIcons name="call" size={16} color={COLORS.brand} />
                    </View>
                    <AppText variant="bodySmall" color={COLORS.contentPrimary} numberOfLines={1} style={styles.infoText}>
                      {user.contactNumber}
                    </AppText>
                  </View>
                )}
                {/* {!!user.id && (
                  <>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconWrap}>
                        <MaterialIcons name="badge" size={16} color={COLORS.brand} />
                      </View>
                      <AppText variant="bodySmall" color={COLORS.contentPrimary} style={styles.infoText}>
                        User ID: {user.id}
                      </AppText>
                    </View>
                  </>
                )} */}
              </View>

              {/* Referral code card */}
              {/* {!!user.referralCode && (
                <View style={styles.referralCard}>
                  <Ionicons name="gift-outline" size={18} color={COLORS.brand} />
                  <View style={{ marginLeft: SIZES.space.sm, flex: 1 }}>
                    <AppText variant="caption" color={COLORS.contentMuted}>Referral Code</AppText>
                    <AppText variant="bodyBold" color={COLORS.brand}>{user.referralCode}</AppText>
                  </View>
                </View>
              )} */}
            </>
          )}
        </View>

        {/* ---------- Grouped settings sections ---------- */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionWrap}>
            {renderSectionTitle(section.title)}
            <AppCard style={styles.menuCard} padded={false}>
              {section.items.map((item, index) => (
                <View key={item.key}>
                  <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => item.onPress(navigation)}>
                    <View style={[styles.menuIconWrap, { backgroundColor: item.bgColor ?? COLORS.brandAlpha16 }]}>
                      <MaterialIcons name={item.icon as any} size={20} color={item.iconColor ?? COLORS.brand} />
                    </View>
                    <AppText variant="body" color={item.danger ? COLORS.danger : COLORS.contentPrimary} style={{ flex: 1 }}>
                      {item.label}
                    </AppText>
                    <MaterialIcons name="chevron-right" size={20} color={COLORS.contentMuted} />
                  </TouchableOpacity>
                  {index < section.items.length - 1 && <View style={styles.menuDivider} />}
                </View>
              ))}
            </AppCard>
          </View>
        ))}

        {/* ---------- Logout: full-width outlined button ---------- */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={handleLogout}>
          <MaterialIcons name="logout" size={18} color={COLORS.danger} />
          <AppText variant="bodyBold" color={COLORS.danger} style={{ marginLeft: SIZES.space.sm }}>
            Logout
          </AppText>
        </TouchableOpacity>

        {/* ---------- Footer ---------- */}
        <View style={styles.footerDivider} />
        <View style={styles.footer}>
          <AppText variant="label" color={COLORS.contentMuted} align="center">
            App Version {Constants.expoConfig?.version ?? '—'}
          </AppText>
          <AppText variant="label" color={COLORS.contentBrand} align="center" style={{ marginTop: 4, fontSize: 14 }}>
            Powered by BRIGHTECH SOFTWARE
          </AppText>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
      <BottomTab activeScreen="PROFILE" />
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfacePage,
  },
  content: {
    padding: SIZES.space.lg,
  },

  // Hero
  heroWrap: {
    alignItems: 'center',
    marginBottom: SIZES.space.lg,
  },
  avatarCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.space.sm,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surfacePage,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  avatarFallback: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.space.md,
    marginTop: SIZES.space.sm,
    width: '90%',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    ...ELEVATION.raised,
  },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.brandAlpha16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: SIZES.space.sm,
  },
  infoText: {
    flex: 1,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brandTint,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.space.md,
    paddingVertical: SIZES.space.sm,
    marginTop: SIZES.space.sm,
    width: '90%',
    borderWidth: 1,
    borderColor: COLORS.brandAlpha16,
  },


  // Sections
  sectionWrap: {
    marginBottom: SIZES.space.lg,
  },
  sectionTitle: {
    marginBottom: SIZES.space.xs,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  menuCard: {},
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.space.md,
    paddingHorizontal: SIZES.space.lg,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.space.lg,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginLeft: SIZES.space.lg + 36 + SIZES.space.lg,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.space.md,
    marginBottom: SIZES.space.lg,
  },

  // Footer
  footerDivider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginBottom: SIZES.space.sm,
  },
  footer: {
    alignItems: 'center',
  },
});