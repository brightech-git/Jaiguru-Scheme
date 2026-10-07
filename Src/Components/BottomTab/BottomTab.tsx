// Floating capsule navigation with the existing stack destinations.
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    iconName: 'home-outline',
    activeIconName: 'home',
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
    iconName: 'card-account-details-outline',
    activeIconName: 'card-account-details',
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

const AnimatedTab = ({ tab, isActive, onPress, badgeCount = 0 }: AnimatedTabProps) => {
  const progress = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 180,
    }).start();
  }, [isActive, progress]);

  const IconComponent = ICON_LIBS[tab.iconLib];
  const iconName = isActive && tab.activeIconName ? tab.activeIconName : tab.iconName;
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] });
  const pillScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Pressable
      style={styles.footerBtnContainer}
      onPress={onPress}
      onPressIn={() => Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 0 }).start()}
      onPressOut={() => Animated.spring(press, { toValue: 0, useNativeDriver: true, speed: 30, bounciness: 8 }).start()}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={badgeCount > 0 ? `${tab.label}, ${badgeCount} unread notifications` : tab.label}
      hitSlop={6}
    >
      <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
        <View style={styles.iconSlot}>
          <Animated.View style={[styles.activePill, { opacity: progress, transform: [{ scale: pillScale }] }]} />
          <IconComponent name={iconName as any} size={SIZES.icon.md} color={isActive ? COLORS.contentBrand : COLORS.accentTint} />
          {badgeCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
            </View>
          )}
        </View>
        <Text numberOfLines={1} style={[styles.label, isActive ? styles.activeText : styles.inactiveText]}>{tab.label}</Text>
      </Animated.View>
    </Pressable>
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
    <View pointerEvents="box-none" style={[styles.host, { paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 0 : 10) }]}>
      <View style={styles.shadowWrap}>
        <View style={styles.capsule}>
          <LinearGradient
            colors={[COLORS.brandStrong, COLORS.brand, COLORS.brandMuted]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />
          <View style={styles.footerContainer}>
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
        </View>
      </View>
    </View>
  );
}

export default BottomTab;
