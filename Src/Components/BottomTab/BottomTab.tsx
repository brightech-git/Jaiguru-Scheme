// Src/Components/BottomTab/BottomTab.tsx
//
// App-wide bottom navigation bar. This is NOT a react-navigation
// Tab.Navigator — each screen mounts <BottomTab activeScreen="..." /> itself
// at the bottom of its own layout (matching the pattern already used by
// HomeScreen/SchemeDetailScreen/HelpCenter before this change). That keeps
// every tab's screen as a normal Stack.Screen (so existing navigation.push
// calls, headers, etc. keep working) while still giving the persistent
// 5-tab bar the user asked for: My Schemes, Support, Home (center,
// elevated), Profile, Alerts — each tab icon/label animates between its
// active and inactive state instead of just swapping color instantly.
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../Utills/AppTheme';
import useNotifications from '../../api/hooks/Notifications/useNotifications';
import { notificationEmitter } from '../NotificationBanner/NotificationBanner';
import styles from './styles';

type ScreenTarget = string | { name: string; params?: Record<string, any> };

interface TabDef {
  key: string;
  label: string;
  screen: ScreenTarget;
  iconLib: 'MaterialCommunityIcons' | 'MaterialIcons' | 'Ionicons';
  iconName: string;
  activeIconName?: string;
  isCenter?: boolean;
}

interface BottomTabProps {
  activeScreen: string;
}

const TABS: TabDef[] = [
  {
    key: 'HOME',
    label: 'Home',
    screen: { name: 'MainDrawer', params: { screen: 'Home' } },
    iconLib: 'MaterialCommunityIcons',
    iconName: 'home',
    isCenter: true,
  },
  {
    key: 'SCHEMES',
    label: 'My Schemes',
    screen: 'AllSchemes',
    iconLib: 'MaterialIcons',
    iconName: 'savings',
  },
  {
    key: 'WastageCard',
    label: 'Wastage Card',
    screen: 'WastageCard',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'card-account-details',
  },
  
  {
    key: 'ALERTS',
    label: 'Alerts',
    screen: 'NotificationScreen',
    iconLib: 'Ionicons',
    iconName: 'notifications-outline',
    activeIconName: 'notifications',
  },
  {
    key: 'PROFILE',
    label: 'Profile',
    screen: 'Profile',
    iconLib: 'Ionicons',
    iconName: 'person-outline',
    activeIconName: 'person',
  },
];

const ICON_LIBS = { MaterialCommunityIcons, MaterialIcons, Ionicons };

interface AnimatedTabProps {
  tab: TabDef;
  isActive: boolean;
  onPress: () => void;
  badgeCount?: number;
}

// Each tab animates its own scale/lift/color on activation instead of
// snapping — this is the "diesin animated to active and not active" the
// user asked for.
const AnimatedTab = ({ tab, isActive, onPress, badgeCount = 0 }: AnimatedTabProps) => {
  const progress = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  }, [isActive, progress]);

  const IconComponent = ICON_LIBS[tab.iconLib];
  const iconName = isActive && tab.activeIconName ? tab.activeIconName : tab.iconName;

  if (tab.isCenter) {
    const lift = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
    const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

    return (
      <TouchableOpacity style={styles.centerContainer} onPress={onPress} activeOpacity={0.8}>
        <Animated.View style={[styles.centerIconWrap, isActive ? styles.centerIconActive : styles.centerIconInactive, { transform: [{ translateY: lift }, { scale }] }]}>
          <IconComponent name={iconName as any} size={SIZES.icon.lg} color={COLORS.contentOnBrand} />
        </Animated.View>
        <Text style={isActive ? styles.centerActiveText : styles.centerInactiveText}>{tab.label}</Text>
      </TouchableOpacity>
    );
  }

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const lift = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const color = isActive ? COLORS.brand : COLORS.contentSecondary;

  return (
    <TouchableOpacity style={styles.footerBtnContainer} onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={{ transform: [{ scale }, { translateY: lift }] }}>
        <View>
          <IconComponent name={iconName as any} size={SIZES.icon.md} color={color} />
          {badgeCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
            </View>
          )}
        </View>
      </Animated.View>
      <Text style={isActive ? styles.activeText : styles.inactiveText}>{tab.label}</Text>
      {/* {isActive && <View style={styles.activeDot} />} */}
    </TouchableOpacity>
  );
};

function BottomTab({ activeScreen }: BottomTabProps) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  // Only used for the Alerts tab's badge — each BottomTab instance is
  // remounted per-screen (it's not a persistent Tab.Navigator), so this
  // fetches fresh on every screen that renders the bar, plus refreshes
  // instantly when a push notification arrives in the foreground.
  const { unreadCount, refreshUnreadCount } = useNotifications();

  useEffect(() => {
    const handler = () => refreshUnreadCount();
    notificationEmitter.on('unread-changed', handler);
    return () => {
      notificationEmitter.off('unread-changed', handler);
    };
  }, [refreshUnreadCount]);

  const handlePress = (screen: ScreenTarget) => {
    if (typeof screen === 'string') {
      navigation.navigate(screen as never);
    } else {
      navigation.navigate(screen.name as never, screen.params as never);
    }
  };

  return (
    <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, SIZES.space.xs) }]}>
      {TABS.map((tab) => (
        <AnimatedTab
          key={tab.key}
          tab={tab}
          isActive={activeScreen === tab.key}
          onPress={() => handlePress(tab.screen)}
          badgeCount={tab.key === 'ALERTS' ? unreadCount : 0}
        />
      ))}
    </View>
  );
}

export default BottomTab;
