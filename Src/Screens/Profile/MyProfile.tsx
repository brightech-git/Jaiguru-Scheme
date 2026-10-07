import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../Components/PremiumBackground/PremiumBackground';
import { getAuthSession, getUserData, getUserId } from '../../Utills/AsynchStorageHelper';
import { COLORS, SIZES } from '../../Utills/AppTheme';
import ProfileDetailsSection from './ProfileDetailsSection';

export default function MyProfileScreen() {
  const [userId, setUserId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      try {
        const [data, session, storedId] = await Promise.all([getUserData(), getAuthSession(), getUserId()]);
        const info = data || session?.user || {};
        if (active) setUserId(info.userId ?? info.userid ?? info.id ?? storedId ?? null);
      } catch {
        if (active) setUserId(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []));

  return (
    <View style={styles.root}>
      <PremiumBackground />
      <CommonHeader title="My Profile" showBack transparent borderBottom={false} shadow={false} />
      <SafeAreaView edges={['bottom']} style={styles.body}>
        {loading ? <ActivityIndicator color={COLORS.brand} style={styles.loading} /> : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <ProfileDetailsSection key={String(userId)} userId={userId} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surfacePage },
  body: { flex: 1 },
  content: { padding: SIZES.space.lg },
  loading: { marginTop: SIZES.space.xxl },
});
