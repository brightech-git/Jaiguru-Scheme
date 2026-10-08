import ApiImage from '../ApiImage';
import { Text } from '../Typography/FontText';
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { EventEmitter } from 'eventemitter3';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../../Utills/AppTheme';
import { handleNotificationNavigation } from '../../Navigations/navigationRef';

const { COLORS } = theme;

export const notificationEmitter = new EventEmitter();

export interface BannerData {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

const BANNER_HEIGHT = 80;
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;

const BannerContent = ({ data, onHide }: { data: BannerData; onHide: () => void }) => {
  const translateY = useRef(new Animated.Value(-(BANNER_HEIGHT + STATUS_BAR_HEIGHT + 20))).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
    }).start();

    timerRef.current = setTimeout(() => slideOut(), 4500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const slideOut = () => {
    Animated.timing(translateY, {
      toValue: -(BANNER_HEIGHT + STATUS_BAR_HEIGHT + 20),
      duration: 350,
      useNativeDriver: true,
    }).start(() => onHide());
  };

  const handlePress = () => {
    // Tapping the banner both dismisses it and takes the user to whatever
    // screen the push notification's data payload points at (falls back to
    // the notification list if none was specified).
    handleNotificationNavigation(data.data);
    slideOut();
  };

  return (
    <Animated.View style={[styles.wrapper, { paddingTop: STATUS_BAR_HEIGHT + 8, transform: [{ translateY }] }]}>
      <TouchableOpacity activeOpacity={0.95} onPress={handlePress} style={styles.card}>
        <View style={styles.appRow}>
          <MaterialCommunityIcons name="bell-outline" size={12} color={COLORS.contentMuted} />
          <Text style={styles.appName}>Jaiguru DigiGold</Text>
          <Text style={styles.timeText}>now</Text>
        </View>
        <View style={styles.contentRow}>
          <View style={styles.textBlock}>
            <Text style={styles.title} numberOfLines={1}>{data.title}</Text>
            <Text style={styles.body} numberOfLines={2}>{data.body}</Text>
          </View>
          {data.imageUrl ? (
            <ApiImage source={{ uri: data.imageUrl }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.iconFallback}>
              <MaterialCommunityIcons name="bell" size={26} color={COLORS.contentBrand} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const NotificationBanner = () => {
  const [data, setData] = useState<BannerData | null>(null);

  useEffect(() => {
    const handler = (payload: BannerData) => setData(payload);
    notificationEmitter.on('show', handler);
    return () => { notificationEmitter.off('show', handler); };
  }, []);

  if (!data) return null;

  return <BannerContent data={data} onHide={() => setData(null)} />;
};

export default NotificationBanner;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  appName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.contentMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.contentMuted,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textBlock: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  iconFallback: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
