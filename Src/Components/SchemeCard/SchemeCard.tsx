// Src/Components/SchemeCard/SchemeCard.tsx
import React from 'react';
import { View, FlatList, StyleSheet, ImageBackground, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useSchemeCatalog } from '../../api/hooks/Schemes/useSchemeCatalog';
import { Scheme } from '../../types/Scheme/Scheme';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import placeholderImage from '../../Assets/Company/logo.png';
import { COLORS, SIZES, FONTS, moderateScale, ELEVATION } from '../../Utills/AppTheme';
import { IMAGE_BASE_URL } from '../../Config/BaseUrl';

export default function SchemeCardSlider() {
  const { schemes, loading } = useSchemeCatalog();
  const navigation = useNavigation<any>();

  // const filtered = schemes.filter((s) => s.SchemeId === 17);
  // if (loading || filtered.length === 0) return null;

  const screenWidth = Dimensions.get('window').width;
  const CARD_WIDTH = screenWidth;
  const SNAP_INTERVAL = CARD_WIDTH;
  const IMAGE_HEIGHT = CARD_WIDTH * (9 / 16);

  const handleJoinScheme = (scheme: Scheme) => {
    navigation.navigate('SchemeTermsAcceptance', { scheme });
  };

  const renderItem = ({ item }: { item: Scheme & { image_path?: string } }) => {
    const imageUri = item.image_path ? `${IMAGE_BASE_URL}${item.image_path}` : placeholderImage;

    return (
      <View style={{ width: CARD_WIDTH, paddingHorizontal: SIZES.space.sm }}>
        <View style={styles.cardContainer}>
          <ImageBackground
            source={typeof imageUri === 'string' ? { uri: imageUri } : imageUri}
            style={[styles.imageBackground, { height: IMAGE_HEIGHT }]}
            resizeMode="cover"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.actionButton, styles.joinButton]} onPress={() => handleJoinScheme(item)}>
              <Text style={styles.joinButtonText}>View terms &amp; join</Text>
              <Ionicons name="arrow-forward" size={moderateScale(18)} color={COLORS.contentBrand} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={schemes}
      keyExtractor={(item) => item.SchemeId.toString()}
      renderItem={renderItem}
      horizontal
      pagingEnabled
      snapToInterval={SNAP_INTERVAL}
      snapToAlignment="center"
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingVertical: SIZES.space.lg,
      }}
    />
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    ...ELEVATION.floating,
  },
  imageBackground: {
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SIZES.space.lg,
    backgroundColor: COLORS.surfacePage,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SIZES.space.sm,
    borderRadius: SIZES.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.space.md,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  joinButtonText: {
    ...FONTS.bodySm,
    color: COLORS.contentBrand,
    fontFamily: FONTS.family.semiBold,
  },
});
