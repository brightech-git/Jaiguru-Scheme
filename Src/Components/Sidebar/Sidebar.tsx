import { Text } from '../Typography/FontText';
import React, { useState, useMemo, useCallback, memo, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions, StatusBar, ScrollView, Animated, Platform, ActivityIndicator, Image, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  getAuthSession,
  getUserData,
  clearAuthData,
  getUserId,
  debugAsyncStorage,
} from "../../Utills/AsynchStorageHelper";
import { clearFCMToken } from "../../Helpers/NotificationHelper";
import { COLORS, FONTS, SIZES, ELEVATION } from "../../Utills/AppTheme";

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  route: string;
  badge: number;
  subItems?: { label: string; route: string }[];
}

// Menu items data - Add more items as needed
// NOTE: The internal "LoginCheck" admin/user-list tool used to be exposed
// here to every logged-in user, gated only by a hardcoded admin/admin
// password baked into the app bundle. That is not real access control and
// let any user view every member's personal data, so it has been removed
// from end-user navigation. Re-add it only behind real, server-verified
// admin authentication.
const MENU_ITEMS: MenuItem[] = [

  {
    key: "resetmpin",
    label: "Reset MPIN",
    icon: "lock-reset",
    route: "ResetMPIN",
    badge: 0,
  },
  {
    key: "privacy",
    label: "Privacy Policy",
    icon: "lock-outline",
    route: "PrivacyPolicy",
    badge: 0,
  },
  {
    key: "terms",
    label: "Terms & Conditions",
    icon: "description",
    route: "TermsAndConditions",
    badge: 0,

  },
  {
    key: "deleteaccount",
    label: "Delete Account",
    icon: "delete-outline",
    route: "DeleteAccount",
    badge: 0,

  },
];

// Memoized Badge Component
const Badge = memo(({ count }: { count: number }) => {
  if (count <= 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
});

Badge.displayName = "Badge";

// Memoized SubItem Component
const SubItem = memo(({ subItem, onPress }: { subItem: { label: string; route: string }; onPress: (route: string) => void }) => (
  <TouchableOpacity
    style={styles.subItem}
    onPress={() => onPress(subItem.route)}
    activeOpacity={0.7}
  >
    <View style={styles.subItemDot} />
    <Text style={styles.subItemLabel}>{subItem.label}</Text>
  </TouchableOpacity>
));

SubItem.displayName = "SubItem";

interface DrawerItemProps {
  item: MenuItem;
  isActive: boolean;
  onPress: (route: string) => void;
  showSubItems: boolean;
  onToggleSubItems: (key: string) => void;
}

// Enhanced DrawerItem Component
const DrawerItem = memo(
  ({ item, isActive, onPress, showSubItems, onToggleSubItems }: DrawerItemProps) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 150,
        friction: 3,
      }).start();
    }, [scaleAnim]);

    const handlePressOut = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 3,
      }).start();
    }, [scaleAnim]);

    const hasSubItems = item.subItems && item.subItems.length > 0;

    const handlePress = useCallback(() => {
      if (hasSubItems) {
        onToggleSubItems(item.key);
      } else {
        onPress(item.route);
      }
    }, [hasSubItems, item.key, item.route, onToggleSubItems, onPress]);

    return (
      <View style={styles.itemContainer}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[styles.item, isActive && styles.activeItem]}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Icon
                name={item.icon}
                size={SIZES.icon.md}
                color={isActive ? COLORS.surface : COLORS.accent}
              />
              <Badge count={item.badge} />
            </View>

            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {item.label}
            </Text>

            {hasSubItems && (
              <Icon
                name={showSubItems ? "expand-less" : "expand-more"}
                size={SIZES.icon.md}
                color={isActive ? COLORS.surface : COLORS.contentMuted}
                style={styles.arrowIcon}
              />
            )}
          </TouchableOpacity>
        </Animated.View>

        {hasSubItems && showSubItems && (
          <View style={styles.subItemsContainer}>
            {item.subItems!.map((subItem, index) => (
              <SubItem
                key={`${item.key}-sub-${index}`}
                subItem={subItem}
                onPress={onPress}
              />
            ))}
          </View>
        )}
      </View>
    );
  },
);

DrawerItem.displayName = "DrawerItem";

interface SidebarUser {
  id: string | number | null;
  name: string;
  email: string;
  contactNumber: string;
  picture: string;
  referralCode: string;
  loginType: string;
  avatarColor: string;
  isLoading: boolean;
}

// User Avatar Component with Fallback
const UserAvatar = memo(({ user, size = 60 }: { user: SidebarUser; size?: number }) => {
  if (user.picture && user.picture !== "") {
    return (
      <Image
        source={{ uri: user.picture }}
        style={[styles.avatarImage, { width: size, height: size }]}
        resizeMode="cover"
        defaultSource={require("../../Assets/Icons/avatar.jpg")}
      />
    );
  }

  // Fallback to colored initials
  return (
    <View
      style={[
        styles.avatarFallback,
        {
          width: size,
          height: size,
          backgroundColor: user.avatarColor
        },
      ]}
    >
      <Text style={styles.avatarText}>
        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
      </Text>
    </View>
  );
});

UserAvatar.displayName = "UserAvatar";

interface SideBarProps {
  navigation: any;
  activeRoute?: string;
  onClose?: () => void;
  isVisible?: boolean;
}

// Main SideBar Component with RTL animation
const SideBar = ({ navigation, activeRoute, onClose, isVisible = true }: SideBarProps) => {
  const { width, height } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const isLandscape = width > height;

  // Animation values for slide in from right
  const slideAnim = useRef(new Animated.Value(width)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<SidebarUser>({
    id: null,
    name: "",
    email: "",
    contactNumber: "",
    picture: "",
    referralCode: "",
    loginType: "",
    avatarColor: "#2274D4",
    isLoading: true,
  });

  // Calculate sidebar width
  const sidebarWidth = useMemo(() => {
    if (isLandscape) {
      return Math.min(width * 0.4, 350);
    }
    return Math.min(width * 0.85, 400);
  }, [width, isLandscape]);

  // Animate sidebar when component mounts or visibility changes
  useEffect(() => {
    if (isVisible) {
      // Slide in from right
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Slide out to right
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: sidebarWidth,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isVisible, slideAnim, opacityAnim, overlayAnim, sidebarWidth]);

  // Fetch user data from AsyncStorage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log("=== SIDEBAR: FETCHING USER DATA ===");

        // Method 1: Get user data directly
        const userData = await getUserData();
        console.log("User data from getUserData():", userData);

        // Method 2: Get auth session
        const session = await getAuthSession();
        console.log("Auth session:", session);

        // Method 3: Get user ID separately
        const userId = await getUserId();
        console.log("User ID from getUserId():", userId);

        // Debug all AsyncStorage
        await debugAsyncStorage();

        // Use the data we have
        const userInfo: Record<string, any> = userData || session?.user || {};

        console.log("Extracted user info:", {
          id: userInfo.userId || userInfo.userid,
          username: userInfo.username,
          email: userInfo.email,
          contactNumber: userInfo.contactNumber,
          picture: userInfo.picture,
          loginType: userInfo.loginType,
          referralCode: userInfo.referralCode,
        });

        // Set user data with proper fallbacks
        setUser({
          id: userInfo.userId || userInfo.userid || userId,
          name: userInfo.username || userInfo.name || "User",
          email: userInfo.email || "",
          contactNumber: userInfo.contactNumber || userInfo.mobileNumber || "",
          picture: userInfo.picture || "",
          referralCode: userInfo.referralCode || "",
          loginType: userInfo.loginType || "normal",
          avatarColor: getAvatarColor(userInfo.username || userInfo.name || "User"),
          isLoading: false,
        });

      } catch (error) {
        console.error("Error loading user data:", error);
        setUser({
          id: null,
          name: "Guest User",
          email: "",
          contactNumber: "",
          picture: "",
          referralCode: "",
          loginType: "unknown",
          avatarColor: "#2274D4",
          isLoading: false,
        });
      }
    };

    fetchUserData();
  }, []);

  // Function to generate avatar color based on name
  const getAvatarColor = useCallback((name: string): string => {
    const colors = [
      "#2274D4", // Blue
      "#2A8448", // Green
      "#EB0000", // Red
      "#A16800", // Orange
      "#9B59B6", // Purple
      "#12846D", // Teal
      "#DF2E1B", // Alizarin
      "#207AB6", // Peter River
      "#1E8549", // Emerald
    ];

    if (!name) return colors[0];

    const hash = name.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Optimized toggle function
  const toggleSubItems = useCallback((key: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  // Optimized navigation handler
  const handleNavigate = useCallback(
    (route: string) => {
      // Close drawer first
      if (onClose) {
        onClose();
      }
      // Then navigate
      navigation.navigate(route);
    },
    [navigation, onClose],
  );

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      // Clear all auth data
      await clearAuthData();
      await clearFCMToken();

      // Close drawer first
      if (onClose) {
        onClose();
      }

      // Navigate to Login screen
      navigation.getParent()?.navigate('Login');

      console.log("Logout successful");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [navigation, onClose]);

  // Handle overlay press to close drawer
  const handleOverlayPress = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  return (
    <>
      {/* Overlay background */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayAnim,
          }
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleOverlayPress}
        />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.container,
          {
            width: sidebarWidth,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            transform: [{ translateX: slideAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <StatusBar
          backgroundColor={COLORS.brand}
          barStyle="light-content"
          translucent={Platform.OS === "android"}
        />

        {/* Header with Back and Edit Icons */}
        <View style={styles.header}>


        </View>

        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <LinearGradient
            colors={[COLORS.brand, COLORS.brandStrong]}
            style={styles.profileGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {user.isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.contentOnBrand} />
                <Text style={styles.loadingText}>Loading user data...</Text>
              </View>
            ) : (
              <View style={styles.profileContent}>
                <UserAvatar user={user} size={70} />

                <View style={styles.profileInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {user.name}
                    </Text>
                    {user.loginType === "GOOGLE" && (
                      <Icon
                        name="verified"
                        size={16}
                        color={COLORS.contentOnBrand}
                        style={styles.verifiedIcon}
                      />
                    )}
                  </View>

                  <Text style={styles.profileEmail} numberOfLines={1}>
                    {user.email}
                  </Text>

                  {user.contactNumber ? (
                    <View style={styles.contactRow}>
                      <Icon
                        name="phone"
                        size={12}
                        color="rgba(255, 255, 255, 0.8)"
                      />
                      <Text style={styles.profileMobile} numberOfLines={1}>
                        {user.contactNumber}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Scrollable Menu Items */}
        <ScrollView
          style={styles.menuContainer}
          contentContainerStyle={styles.menuContentContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="never"
        >
          {MENU_ITEMS.map((item) => (
            <DrawerItem
              key={item.key}
              item={item}
              isActive={activeRoute === item.route}
              onPress={handleNavigate}
              showSubItems={expandedItems.has(item.key)}
              onToggleSubItems={toggleSubItems}
            />
          ))}
        </ScrollView>

        {/* Footer Section */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Icon name="logout" size={SIZES.icon.md} color={COLORS.danger} />
            <Text style={styles.footerButtonText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>v1.2.0</Text>
            <View style={styles.statusDot} />
            <Text style={styles.versionText}>Online</Text>
          </View>
        </View>
      </Animated.View>
    </>
  );
};

export default memo(SideBar);

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  overlayTouchable: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    ...ELEVATION.floating,
    zIndex: 1000,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.space.lg,
    paddingVertical: SIZES.space.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.border,
  },
  profileSection: {
    marginHorizontal: SIZES.space.lg,
    marginVertical: SIZES.space.lg,
    borderRadius: SIZES.radius.lg,
    overflow: "hidden",
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 160,
  },
  profileGradient: {
    padding: SIZES.space.lg,
    flex: 1,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.contentOnBrand,
    marginTop: SIZES.space.sm,
  },
  avatarImage: {
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarFallback: {
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SIZES.space.lg,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarText: {
    ...FONTS.display,
    color: COLORS.contentOnBrand,
    fontWeight: "bold",
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  profileName: {
    ...FONTS.title,
    color: COLORS.contentOnBrand,
    fontWeight: "600",
    flex: 1,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  profileEmail: {
    ...FONTS.body,
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  profileMobile: {
    ...FONTS.body,
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginLeft: 4,
  },
  menuContainer: {
    flex: 1,
  },
  menuContentContainer: {
    paddingVertical: SIZES.space.sm,
  },
  itemContainer: {
    marginBottom: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SIZES.space.md,
    paddingHorizontal: SIZES.space.lg,
    marginHorizontal: SIZES.space.md,
    borderRadius: SIZES.radius.md,
    backgroundColor: "transparent",
    minHeight: 48,
  },
  activeItem: {
    backgroundColor: COLORS.brand,
    ...ELEVATION.raised,
  },
  iconContainer: {
    position: "relative",
    marginRight: SIZES.space.lg,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  badgeText: {
    ...FONTS.label,
    color: COLORS.contentOnBrand,
    fontSize: 9,
    fontWeight: "bold",
  },
  label: {
    ...FONTS.body,
    color: COLORS.contentPrimary,
    flex: 1,
    fontSize: 15,
  },
  activeLabel: {
    ...FONTS.bodyEmphasis,
    color: COLORS.contentOnBrand,
    fontWeight: "600",
  },
  arrowIcon: {
    marginLeft: "auto",
  },
  subItemsContainer: {
    marginLeft: SIZES.space.xl * 2,
    marginTop: SIZES.space.xs,
    marginBottom: SIZES.space.sm,
    paddingLeft: SIZES.space.sm,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border,
  },
  subItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SIZES.space.sm,
    paddingHorizontal: SIZES.space.md,
    minHeight: 40,
  },
  subItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.contentMuted,
    marginRight: SIZES.space.md,
  },
  subItemLabel: {
    ...FONTS.body,
    color: COLORS.contentMuted,
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SIZES.space.lg,
    paddingVertical: SIZES.space.md,
    backgroundColor: COLORS.surface,
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SIZES.space.md,
    paddingHorizontal: SIZES.space.sm,
    marginBottom: SIZES.space.md,
    borderRadius: SIZES.radius.md,
    backgroundColor: "rgba(255, 0, 0, 0.05)",
  },
  footerButtonText: {
    ...FONTS.body,
    marginLeft: SIZES.space.md,
    color: COLORS.danger,
    fontWeight: "600",
  },
  versionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.space.xs,
  },
  versionText: {
    ...FONTS.caption,
    color: COLORS.contentMuted,
    fontSize: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginHorizontal: SIZES.space.sm,
  },
});
