import { Text } from '../../Components/Typography/FontText';
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppContentScreen from '../../Components/AppContent/AppContentScreen';
import { AppButton } from '../../Components/ui/appcomponents';
import theme from '../../Utills/AppTheme';
import { Scheme } from '../../types/Scheme/Scheme';
import { requiresKycFromControls, softControlService } from '../../api/services/softControlService';

type SchemeTermsRouteParams = { scheme?: Scheme } | undefined;

const SchemeTermsAcceptance = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, SchemeTermsRouteParams>, string>>();
  const { scheme } = route.params || {};
  const [accepted, setAccepted] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { COLORS, SIZES, FONTS } = theme;

  const joinScheme = async () => {
    if (!accepted || !scheme || isJoining) return;

    setIsJoining(true);
    try {
      const controls = await softControlService.getKycUpdation();
      navigation.navigate('MemberCreation', { scheme, requiresKyc: requiresKycFromControls(controls) });
    } catch (error) {
      // Do not bypass KYC if the control cannot be checked.
      console.log('Failed to load KYC soft control; using KYC flow', error);
      navigation.navigate('MemberCreation', { scheme, requiresKyc: true });
    }
  };

  if (!scheme?.SchemeSName) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.space.gutter, backgroundColor: COLORS.surfacePage }}>
        <Text style={{ ...FONTS.body, color: COLORS.contentSecondary, textAlign: 'center' }}>
          Terms and conditions are not available for this scheme.
        </Text>
        <AppButton label="Go Back" variant="outline" onPress={() => navigation.goBack()} style={{ marginTop: SIZES.space.lg }} />
      </View>
    );
  }

  return (
    <AppContentScreen
      contentId={scheme.SchemeSName}
      title="Plan Terms & Conditions"
      navigation={navigation}
      footer={(language) => (
        <View
          style={{
            paddingHorizontal: SIZES.space.gutter,
            paddingTop: SIZES.space.md,
            paddingBottom: SIZES.space.lg,
            backgroundColor: COLORS.surface,
            borderTopWidth: 1,
            borderTopColor: COLORS.borderSubtle,
          }}
        >
          <TouchableOpacity
            onPress={() => setAccepted((value) => !value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.space.md }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: SIZES.radius.sm,
                borderWidth: 1.5,
                borderColor: accepted ? COLORS.brand : COLORS.border,
                backgroundColor: accepted ? COLORS.brand : COLORS.surface,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: SIZES.space.sm,
              }}
            >
              {accepted ? <Ionicons name="checkmark" size={18} color={COLORS.contentOnBrand} /> : null}
            </View>
            <Text style={{ ...FONTS.bodyStrong, color: COLORS.contentSecondary, flex: 1 }}>
              {language === 'ta'
                ? 'எனக்கு 18 வயது அல்லது அதற்கு மேற்பட்ட வயது உள்ளது என்பதை உறுதிப்படுத்துகிறேன்.திட்டத்தின் விதிமுறைகள் மற்றும் நிபந்தனைகளை நான் படித்து ஏற்றுக்கொண்டுள்ளேன்.'
                : 'I confirm that I am 18 years of age or above, and I have read and accept the Plan Terms and Conditions.'}
            </Text>
          </TouchableOpacity>
          <AppButton label={language === 'ta' ? 'திட்டத்தில் சேரவும்' : 'Join Scheme'} onPress={joinScheme} loading={isJoining} disabled={!accepted || isJoining} />
        </View>
      )}
    />
  );
};

export default SchemeTermsAcceptance;
