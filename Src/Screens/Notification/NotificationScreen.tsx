import { Text } from '../../Components/Typography/FontText';
// Src/Screens/Notification/NotificationScreen.tsx
import React, { useRef, useMemo, useState } from 'react';
import { View, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Animated, Platform, Image } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import useNotifications, { FormattedNotification } from '../../api/hooks/Notifications/useNotifications';
import { notificationService } from '../../api/services/notificationService';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../Components/PremiumBackground/PremiumBackground';
import BottomTab from '../../Components/BottomTab/BottomTab';
import theme from '../../Utills/AppTheme';

const { COLORS } = theme;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const groupByDate = (items: FormattedNotification[]) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const buckets: Record<string, FormattedNotification[]> = { Today: [], Yesterday: [], Earlier: [] };

  items.forEach((item) => {
    const created = new Date(item.createdAt ?? 0);
    if (isSameDay(created, today)) buckets.Today.push(item);
    else if (isSameDay(created, yesterday)) buckets.Yesterday.push(item);
    else buckets.Earlier.push(item);
  });

  return Object.entries(buckets)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }));
};

const NotificationScreen = () => {
  const swipeableRefs = useRef(new Map<number | string, Swipeable>());
  const animatedIds = useRef(new Set<number | string>());

  const { notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } =
    useNotifications();

  const sections = useMemo(() => groupByDate(notifications), [notifications]);

  const handleDeleteAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Clear All Notifications', 'Are you sure you want to delete all notifications? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await deleteAllNotifications();
        },
        style: 'destructive',
      },
    ]);
  };

  const handleDeleteSingle = async (id: number | string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await deleteNotification(id);
  };

  const handleMarkAsRead = async (item: FormattedNotification) => {
    if (!item.isRead) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await markAsRead(item.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await markAllAsRead();
    }
  };

  const getNotificationIcon = (title?: string) => {
    if (title?.toLowerCase().includes('welcome')) {
      return { name: 'hand-wave', color: COLORS.success, bg: COLORS.success + '18' };
    } else if (title?.toLowerCase().includes('gold') || title?.toLowerCase().includes('silver')) {
      return { name: 'gold', color: COLORS.contentBrand, bg: COLORS.brandAlpha08 };
    } else if (title?.toLowerCase().includes('scheme')) {
      return { name: 'account-cash', color: COLORS.contentBrand, bg: COLORS.brandAlpha16 };
    }
    return { name: 'bell-outline', color: COLORS.contentBrand, bg: COLORS.brandSubtle };
  };

  interface NotificationItemProps {
    item: FormattedNotification;
    index: number;
  }

  const NotificationItem = ({ item, index }: NotificationItemProps) => {
    console.log("notification item",item)
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const isFirstMount = !animatedIds.current.has(item.id);
    const entrance = useRef(new Animated.Value(isFirstMount ? 0 : 1)).current;
    const [expanded, setExpanded] = useState(false);
    const isRead = item.isRead;
    const icon = getNotificationIcon(item.title);

    React.useEffect(() => {
      if (isFirstMount) {
        animatedIds.current.add(item.id);
        Animated.timing(entrance, {
          toValue: 1,
          duration: 380,
          delay: Math.min(index, 8) * 55,
          useNativeDriver: true,
        }).start();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePress = () => {
      setExpanded((prev) => !prev);
      if (!isRead) handleMarkAsRead(item);
    };

    const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: entrance,
            transform: [
              { scale: scaleAnim },
              { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
            ],
          },
        ]}
      >
        <Swipeable
          ref={(ref) => {
            if (ref) swipeableRefs.current.set(item.id, ref);
            else swipeableRefs.current.delete(item.id);
          }}
          renderRightActions={() => <View style={styles.deleteSwipe} />}
          onSwipeableOpen={(direction) => {
            if (direction === 'right') handleDeleteSingle(item.id);
          }}
          overshootRight={false}
        >
          <TouchableOpacity activeOpacity={0.9} onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <View style={styles.card}>
              {!isRead && <View style={styles.accentBar} />}
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: item.imageUrl ? 'transparent' : icon.bg }]}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl as string }} style={styles.notifImage} resizeMode="cover" />
                  ) : (
                    <MaterialCommunityIcons name={icon.name as any} size={22} color={icon.color} />
                  )}
                  {!isRead && <View style={styles.iconDot} />}
                </View>

                <View style={styles.textContainer}>
                  <View style={styles.titleContainer}>
                    <Text style={[styles.title, !isRead && styles.unreadTitle]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.date}>{notificationService.formatNotificationDate(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.message} numberOfLines={expanded ? undefined : 2}>
                    {item.message}
                  </Text>
                  {item.message && item.message.length > 80 && (
                    <Text style={styles.expandHint}>
                      {expanded ? 'Show less ▲' : 'Show more ▼'}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </Animated.View>
    );
  };

  const renderSectionHeader = ({ section }: any) => (
    <Text style={styles.sectionTitle}>{section.title}</Text>
  );

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <PremiumBackground />
        <CommonHeader title="Notifications" transparent borderBottom={false} shadow={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.contentBrand} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  const headerRight = notifications.length > 0 ? (
    <View style={styles.headerActions}>
      <TouchableOpacity
        onPress={handleMarkAllAsRead}
        disabled={unreadCount === 0}
        activeOpacity={0.7}
        style={[styles.headerIconBtn, unreadCount === 0 && styles.disabledBtn]}
      >
        <View style={styles.headerIconCircle}>
          <Ionicons name="checkmark-done-outline" size={20} color={COLORS.contentOnBrand} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDeleteAll} activeOpacity={0.7} style={styles.headerIconBtn}>
        <View style={styles.headerIconCircle}>
          <Ionicons name="trash-outline" size={20} color={COLORS.contentOnBrand} />
        </View>
      </TouchableOpacity>
    </View>
  ) : undefined;

  return (
    <View style={styles.container}>
      <PremiumBackground />
      <CommonHeader title="Notifications" rightComponent={headerRight} transparent borderBottom={false} shadow={false} />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => <NotificationItem item={item} index={index} />}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} colors={[COLORS.brand]} tintColor={COLORS.contentBrand} progressBackgroundColor="#fff" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient colors={[COLORS.accentSoft, COLORS.accentSoft]} style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="bell-off-outline" size={64} color={COLORS.contentBrand} />
            </LinearGradient>
            <Text style={styles.emptyText}>All Caught Up!</Text>
            <Text style={styles.emptySubText}>You have no notifications at the moment</Text>
          </View>
        }
        contentContainerStyle={[styles.listContent, notifications.length === 0 && styles.emptyListContent]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      <BottomTab activeScreen="ALERTS" />
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surfaceMuted },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.contentSecondary, fontWeight: '500' },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerIconBtn: { padding: 2 },
  headerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.4 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.contentMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 6,
  },

  cardWrapper: { marginHorizontal: 16, marginVertical: 5 },
  card: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  accentBar: { width: 4, borderRadius: 2, backgroundColor: COLORS.brand, marginRight: 10 },
  cardContent: { flex: 1, flexDirection: 'row', gap: 12 },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  notifImage: { width: 44, height: 44, borderRadius: 22 },
  iconDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: '#fff',
  },

  textContainer: { flex: 1 },
  titleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.contentPrimary, flex: 1, marginRight: 8 },
  unreadTitle: { fontWeight: '700' },
  message: { fontSize: 13, color: COLORS.contentSecondary, lineHeight: 18 },
  date: { fontSize: 11, color: COLORS.contentMuted, fontWeight: '500' },
  expandHint: { fontSize: 11, color: COLORS.contentBrand, fontWeight: '600', marginTop: 4 },

  deleteSwipe: { width: 84 },

  listContent: { paddingVertical: 8, paddingBottom: 20 },
  emptyListContent: { flexGrow: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyText: { fontSize: 24, fontWeight: 'bold', color: COLORS.contentPrimary, marginBottom: 12 },
  emptySubText: { fontSize: 16, color: COLORS.contentMuted, textAlign: 'center', lineHeight: 24 },
});