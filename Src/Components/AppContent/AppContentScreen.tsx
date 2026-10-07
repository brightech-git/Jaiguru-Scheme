import { Text } from '../Typography/FontText';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import CommonHeader from '../CommonHeader/CommonHeader';
import PremiumBackground from '../PremiumBackground/PremiumBackground';
import theme from '../../Utills/AppTheme';
import { getAppContent } from '../../api/services/appContentService';

type ContentLanguage = 'en' | 'ta';

interface AppContentScreenProps {
  contentId: string;
  title: string;
  navigation: { goBack: () => void };
  /** Optional fixed action area, for flows such as scheme-term acceptance. */
  footer?: React.ReactNode | ((language: ContentLanguage) => React.ReactNode);
}

const buildDocument = (content: string, language: ContentLanguage) => `<!doctype html>
<html lang="${language}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 20px 18px 36px; color: #31251B; background: transparent; font-family: -apple-system, Roboto, Arial, sans-serif; font-size: 16px; line-height: 1.65; }
      .content-lang-switch { display: none !important; }
      [data-lang] { display: none !important; }
      [data-lang="${language}"] { display: block !important; }
      h2 { color: #8B5E18; font-size: 24px; line-height: 1.3; margin: 0 0 18px; }
      h3 { color: #8B5E18; font-size: 19px; line-height: 1.35; margin: 28px 0 10px; }
      h4 { color: #5E421B; font-size: 16px; margin: 20px 0 6px; }
      p { margin: 0 0 14px; }
      ul, ol { margin: 0 0 16px; padding-left: 24px; }
      li { margin-bottom: 7px; }
      a { color: #8B5E18; }
      img, table { max-width: 100%; height: auto; }
    </style>
  </head>
  <body>${content}</body>
</html>`;

const AppContentScreen = ({ contentId, title, navigation, footer }: AppContentScreenProps) => {
  const { COLORS, SIZES, FONTS, STYLES } = theme;
  const [language, setLanguage] = useState<ContentLanguage>('en');
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAppContent(contentId);
      if (!response?.data) throw new Error('Content is unavailable.');
      setContent(response.data);
    } catch {
      setError('Unable to load this page. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  const html = useMemo(() => (content ? buildDocument(content, language) : ''), [content, language]);

  return (
    <SafeAreaView style={STYLES.screen}>
      <PremiumBackground />
      <CommonHeader title={title} onBackPress={navigation.goBack} transparent borderBottom={false} shadow={false} />

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Text style={{ ...FONTS.body, color: COLORS.contentSecondary, marginTop: SIZES.space.md }}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SIZES.space.gutter }}>
          <Text style={{ ...FONTS.body, color: COLORS.contentSecondary, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={loadContent} style={{ ...STYLES.chip.brand, marginTop: SIZES.space.lg }} accessibilityRole="button">
            <Text style={{ ...FONTS.bodyEmphasis, color: COLORS.contentBrand }}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: SIZES.space.gutter, paddingVertical: SIZES.space.sm }}>
            {([
              ['en', 'English'],
              ['ta', 'தமிழ்'],
            ] as const).map(([value, label]) => {
              const active = language === value;
              return (
                <TouchableOpacity key={value} onPress={() => setLanguage(value)} accessibilityRole="button" accessibilityState={{ selected: active }} style={{ flex: 1, alignItems: 'center', paddingVertical: SIZES.space.sm, marginHorizontal: SIZES.space.xs, borderRadius: SIZES.radius.md, backgroundColor: active ? COLORS.brand : COLORS.accentSoft }}>
                  <Text style={{ ...FONTS.bodyEmphasis, color: active ? COLORS.contentOnBrand : COLORS.contentBrand }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <WebView
            key={language}
            source={{ html }}
            style={{ flex: 1, backgroundColor: 'transparent' }}
            originWhitelist={['about:blank']}
            onShouldStartLoadWithRequest={(request) => {
              if (request.url !== 'about:blank') void Linking.openURL(request.url);
              return request.url === 'about:blank';
            }}
          />
          {typeof footer === 'function' ? footer(language) : footer}
        </View>
      )}
    </SafeAreaView>
  );
};

export default AppContentScreen;
