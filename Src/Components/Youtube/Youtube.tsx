import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import YoutubePlayer from 'react-native-youtube-iframe';
import WebView from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/appcomponents';
import { COLORS, SIZES } from '../../Utills/AppTheme';

// Add the public Instagram Reel/post URLs to display in the carousel.
export const INSTAGRAM_VIDEOS: string[] = [];
const INSTAGRAM_PROFILE = 'https://www.instagram.com/jaigurujewellers_/';
const YOUTUBE_VIDEOS = ['jvAQN2XDekY'];

function instagramEmbed(url: string): string | null {
  const match = /^https:\/\/(?:www\.)?instagram\.com\/(reel|p|tv)\/([A-Za-z0-9_-]+)(?:[/?#]|$)/i.exec(url.trim());
  if (match) return `https://www.instagram.com/${match[1]}/${match[2]}/embed/`;
  return url === INSTAGRAM_PROFILE ? `${INSTAGRAM_PROFILE}embed/` : null;
}

function InstagramVideo({ url, width }: { url: string; width: number }) {
  const [failed, setFailed] = useState(false);
  const embed = instagramEmbed(url);
  const isProfile = url === INSTAGRAM_PROFILE;
  const open = () => Linking.openURL(url).catch(() => Alert.alert('Unable to open', 'Please try opening Instagram again.'));
  return (
    <View>
      {embed && !failed ? <WebView
        source={{ uri: embed }} style={{ width, height: isProfile ? 540 : 480 }}
        allowsInlineMediaPlayback mediaPlaybackRequiresUserAction scrollEnabled
        startInLoadingState renderLoading={() => <ActivityIndicator color={COLORS.brand} style={styles.loading} />}
        onError={() => setFailed(true)} onHttpError={() => setFailed(true)}
      /> : <View style={styles.empty}><MaterialCommunityIcons name="instagram" size={32} color={COLORS.brand} /><AppText variant="bodySmall" align="center">{isProfile ? 'Open our Instagram profile to explore our latest reels.' : 'This video is unavailable here. Open it on Instagram to watch.'}</AppText></View>}
      <Pressable onPress={open} accessibilityRole="link" style={styles.openButton}>
        <MaterialCommunityIcons name="instagram" size={18} color={COLORS.brand} /><AppText variant="captionBold" color={COLORS.brand}>{isProfile ? '@jaigurujewellers_' : 'Watch on Instagram'}</AppText><MaterialCommunityIcons name="open-in-new" size={15} color={COLORS.brand} />
      </Pressable>
      {isProfile && <Pressable accessibilityRole="link" style={styles.openButton} onPress={() => Linking.openURL(`${INSTAGRAM_PROFILE}reels/`).catch(() => Alert.alert('Unable to open', 'Please try opening Instagram again.'))}>
        <MaterialCommunityIcons name="movie-play-outline" size={18} color={COLORS.brand} /><AppText variant="captionBold" color={COLORS.brand}>View All Reels</AppText>
      </Pressable>}
    </View>
  );
}

export default function MainPageWithYouTube({ instagramVideos = INSTAGRAM_VIDEOS }: { instagramVideos?: string[] }) {
  const [platform, setPlatform] = useState<'youtube' | 'instagram'>('youtube');
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const focused = useIsFocused();
  const reels = instagramVideos.filter((url) => instagramEmbed(url));
  const videos = platform === 'youtube' ? YOUTUBE_VIDEOS : reels.length ? reels : [INSTAGRAM_PROFILE];

  return (
    <View style={styles.container} onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}>
      <View style={styles.tabs}>
        {/* {(['youtube', 'instagram'] as const).map((item) => <Pressable key={item} onPress={() => { setPlatform(item); setIndex(0); }} accessibilityRole="tab" accessibilityState={{ selected: platform === item }} style={[styles.tab, platform === item && styles.activeTab]}>
          <MaterialCommunityIcons name={item} size={20} color={platform === item ? COLORS.brand : COLORS.contentMuted} />
          <AppText variant="captionBold" color={platform === item ? COLORS.brand : COLORS.contentMuted}>{item === 'youtube' ? 'YouTube' : 'Instagram'}</AppText>
        </Pressable>)} */}
      </View>
      {width > 0 && videos.length > 0 ? <>
        <ScrollView key={`${platform}-${width}`} horizontal pagingEnabled showsHorizontalScrollIndicator={false} nestedScrollEnabled onMomentumScrollEnd={({ nativeEvent }) => setIndex(Math.round(nativeEvent.contentOffset.x / width))}>
          {videos.map((video, position) => <View key={`${video}-${position}`} style={{ width }}>
            {platform === 'youtube' ? <YoutubePlayer height={width * 9 / 16} width={width} videoId={video} play={false} webViewProps={{ allowsInlineMediaPlayback: true, mediaPlaybackRequiresUserAction: true }} /> : focused && index === position ? <InstagramVideo url={video} width={width} /> : <View style={{ width, height: 528, backgroundColor: COLORS.surfaceMuted }} />}
          </View>)}
        </ScrollView>
        <View style={styles.pagination}>
          {videos.map((_, position) => <View key={position} style={[styles.dot, index === position && styles.activeDot]} />)}
          {videos.length > 1 && <AppText variant="caption" color={COLORS.contentMuted}>Swipe to see more</AppText>}
        </View>
      </> : <View style={styles.empty}><MaterialCommunityIcons name="instagram" size={32} color={COLORS.brand} /><AppText variant="bodySmall" color={COLORS.contentMuted}>No Instagram videos available.</AppText></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.surface, width: '100%' },
  tabs: { flexDirection: 'row', gap: SIZES.space.sm, padding: SIZES.space.md },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.space.sm, paddingVertical: SIZES.space.sm, borderRadius: SIZES.radius.pill, backgroundColor: COLORS.surfaceMuted },
  activeTab: { backgroundColor: COLORS.brandTint },
  empty: { minHeight: 180, padding: SIZES.space.lg, alignItems: 'center', justifyContent: 'center', gap: SIZES.space.md },
  loading: { position: 'absolute', top: 24, left: 0, right: 0 },
  openButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SIZES.space.md, gap: SIZES.space.sm },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: SIZES.space.md },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.borderStrong },
  activeDot: { width: 16, backgroundColor: COLORS.brand },
});
