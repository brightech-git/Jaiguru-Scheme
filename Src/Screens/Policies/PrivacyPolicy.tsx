// Src/Screens/Policies/PrivacyPolicy.tsx
import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../../Utills/AppTheme';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../Components/PremiumBackground/PremiumBackground';
import { useCompany } from '../../api/hooks/Company/useCompany';

export interface PrivacyPolicyProps {
  navigation: { goBack: () => void };
}

const PrivacyPolicy = ({ navigation }: PrivacyPolicyProps) => {
  const { COLORS, SIZES, FONTS, ELEVATION, STYLES, moderateScale } = theme;
  const { company } = useCompany();

  const companyName = company?.COMPANYNAME || 'Jaiguru Jewellers';
  const email = company?.EMAIL || '';
  const website = company?.BASEURL || '';

  const openEmail = () => email && Linking.openURL(`mailto:${email}`);
  const openWebsite = () => website && Linking.openURL(website);

  const PolicySection = ({ title, children, isLast = false }: { title: string; children: React.ReactNode; isLast?: boolean }) => (
    <View style={{ marginBottom: isLast ? 0 : SIZES.space.xl }}>
      <Text
        style={{
          ...FONTS.heading,
          color: COLORS.contentBrand,
          marginBottom: SIZES.space.md,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );

  const BulletPoint = ({ text, style = {} }: { text: string; style?: object }) => (
    <View style={{ flexDirection: 'row', marginBottom: SIZES.space.sm }}>
      <Text
        style={{
          ...FONTS.body,
          color: COLORS.contentSecondary,
          marginRight: SIZES.space.sm,
        }}
      >
        •
      </Text>
      <Text
        style={{
          ...FONTS.body,
          color: COLORS.contentSecondary,
          flex: 1,
          ...style,
        }}
      >
        {text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={STYLES.screen}>
      <PremiumBackground />
      <CommonHeader title="Privacy Policy" onBackPress={() => navigation.goBack()} transparent borderBottom={false} shadow={false} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: SIZES.space.gutter,
          paddingBottom: SIZES.space.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Header */}
        <View
          style={{
            alignItems: 'center',
            marginBottom: SIZES.space.xl,
            padding: SIZES.space.lg,
            backgroundColor: COLORS.accentSoft,
            borderRadius: SIZES.radius.lg,
            ...ELEVATION.raised,
          }}
        >
          <View
            style={{
              width: moderateScale(60),
              height: moderateScale(60),
              borderRadius: SIZES.radius.lg,
              backgroundColor: COLORS.brand,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: SIZES.space.md,
            }}
          >
            <Text
              style={{
                fontSize: SIZES.text.xxl,
                color: COLORS.contentOnBrand,
                fontWeight: 'bold',
              }}
            >
              SF
            </Text>
          </View>
          <Text style={{ ...FONTS.heading, color: COLORS.contentBrand, textAlign: 'center' }}>{companyName}</Text>
          <Text
            style={{
              ...FONTS.bodySm,
              color: COLORS.contentSecondary,
              textAlign: 'center',
              marginTop: SIZES.space.xs,
            }}
          >
            Last Updated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Introduction */}
        <PolicySection title="1. Introduction">
          <Text
            style={{
              ...FONTS.body,
              color: COLORS.contentSecondary,
              marginBottom: SIZES.space.sm,
            }}
          >
            At {companyName}, we prioritize your privacy. This policy details how we collect, use, and protect your
            information when you engage with our services.
          </Text>
        </PolicySection>

        {/* Data Collected */}
        <PolicySection title="2. Data Collected">
          <Text
            style={{
              ...FONTS.body,
              color: COLORS.contentSecondary,
              marginBottom: SIZES.space.md,
            }}
          >
            We collect essential information to deliver our services effectively:
          </Text>

          <BulletPoint text="Name and contact information" />
          <BulletPoint text="Email address and phone number" />
          <BulletPoint text="Service address and location details" />
          <BulletPoint text="Payment information (securely processed via trusted gateways)" />
          <BulletPoint text="Technical data (cookies and browser information)" />
        </PolicySection>

        {/* How We Use Your Data */}
        <PolicySection title="3. How We Use Your Data">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.space.sm }}>
            <Text style={{ ...FONTS.body, color: COLORS.successText, marginRight: SIZES.space.sm }}>✓</Text>
            <Text style={{ ...FONTS.body, color: COLORS.contentSecondary, flex: 1 }}>To process service requests and transactions</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.space.sm }}>
            <Text style={{ ...FONTS.body, color: COLORS.successText, marginRight: SIZES.space.sm }}>✓</Text>
            <Text style={{ ...FONTS.body, color: COLORS.contentSecondary, flex: 1 }}>For client communication and support</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.space.sm }}>
            <Text style={{ ...FONTS.body, color: COLORS.successText, marginRight: SIZES.space.sm }}>✓</Text>
            <Text style={{ ...FONTS.body, color: COLORS.contentSecondary, flex: 1 }}>To enhance service delivery and user experience</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.space.sm }}>
            <Text style={{ ...FONTS.body, color: COLORS.successText, marginRight: SIZES.space.sm }}>✓</Text>
            <Text style={{ ...FONTS.body, color: COLORS.contentSecondary, flex: 1 }}>For business analytics and operational improvement</Text>
          </View>

          <View style={{ marginTop: SIZES.space.md }}>
            <Text
              style={{
                ...FONTS.body,
                color: COLORS.contentBrand,
                fontStyle: 'italic',
              }}
            >
              We process only data essential for service provision.
            </Text>
          </View>
        </PolicySection>

        {/* Data Sharing */}
        <PolicySection title="4. Data Sharing">
          <Text
            style={{
              ...FONTS.body,
              color: COLORS.contentSecondary,
              marginBottom: SIZES.space.md,
            }}
          >
            We Do Not
          </Text>

          <View
            style={{
              backgroundColor: COLORS.danger + '20',
              padding: SIZES.space.md,
              borderRadius: SIZES.radius.md,
              marginBottom: SIZES.space.lg,
            }}
          >
            <BulletPoint text="Sell or rent personal data" />
            <BulletPoint text="Share with unauthorized third parties" />
          </View>

          <Text
            style={{
              ...FONTS.body,
              color: COLORS.contentSecondary,
              marginBottom: SIZES.space.md,
            }}
          >
            We May Share With
          </Text>

          <View
            style={{
              backgroundColor: COLORS.success + '20',
              padding: SIZES.space.md,
              borderRadius: SIZES.radius.md,
            }}
          >
            <BulletPoint text="Service providers for operational needs" />
            <BulletPoint text="Payment processing partners" />
            <BulletPoint text="Legal entities when required" />
          </View>

          <Text
            style={{
              ...FONTS.bodySm,
              color: COLORS.contentMuted,
              marginTop: SIZES.space.md,
              fontStyle: 'italic',
            }}
          >
            All partners are contractually bound to protect your data.
          </Text>
        </PolicySection>

        {/* Security Measures */}
        <PolicySection title="5. Security Measures">
          <View
            style={{
              ...STYLES.card.brandSoft,
              marginBottom: SIZES.space.lg,
            }}
          >
            <Text
              style={{
                ...FONTS.label,
                color: COLORS.contentBrand,
                marginBottom: SIZES.space.sm,
              }}
            >
              Encryption
            </Text>
            <Text style={{ ...FONTS.body, color: COLORS.contentSecondary }}>All data transmissions use SSL encryption</Text>
          </View>

          <View
            style={{
              ...STYLES.card.brandSoft,
              marginBottom: SIZES.space.lg,
            }}
          >
            <Text
              style={{
                ...FONTS.label,
                color: COLORS.contentBrand,
                marginBottom: SIZES.space.sm,
              }}
            >
              Data Storage
            </Text>
            <Text style={{ ...FONTS.body, color: COLORS.contentSecondary }}>Information stored on secured servers with monitoring</Text>
          </View>

          <View
            style={{
              backgroundColor: COLORS.warning + '10',
              padding: SIZES.space.md,
              borderRadius: SIZES.radius.md,
              borderLeftWidth: 4,
              borderLeftColor: COLORS.warning,
            }}
          >
            <Text
              style={{
                ...FONTS.bodySm,
                color: COLORS.contentSecondary,
                fontStyle: 'italic',
              }}
            >
              While we implement robust security, no internet transmission is entirely risk-free.
            </Text>
          </View>
        </PolicySection>

        {/* Cookies */}
        <PolicySection title="6. Cookies" isLast={true}>
          <Text
            style={{
              ...FONTS.body,
              color: COLORS.contentSecondary,
              marginBottom: SIZES.space.md,
            }}
          >
            Our website utilizes cookies for:
          </Text>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginBottom: SIZES.space.lg,
            }}
          >
            {['Performance', 'Site functionality', 'Analytics', 'Visitor insights', 'Personalization', 'User preferences'].map((label) => (
              <View
                key={label}
                style={{
                  ...STYLES.chip.brand,
                  marginRight: SIZES.space.sm,
                  marginBottom: SIZES.space.sm,
                }}
              >
                <Text style={{ ...FONTS.bodySm, color: COLORS.contentBrand }}>{label}</Text>
              </View>
            ))}
          </View>

          <View
            style={{
              backgroundColor: COLORS.info + '10',
              padding: SIZES.space.md,
              borderRadius: SIZES.radius.md,
              marginBottom: SIZES.space.lg,
            }}
          >
            <Text
              style={{
                ...FONTS.body,
                color: COLORS.contentSecondary,
                marginBottom: SIZES.space.sm,
              }}
            >
              You may disable cookies in browser settings, though some features may be limited.
            </Text>
          </View>
        </PolicySection>

        {/* Contact Information */}
        <View
          style={{
            ...STYLES.card.base,
            backgroundColor: COLORS.accentSoft,
            alignItems: 'center',
            marginTop: SIZES.space.xl,
            marginBottom: SIZES.space.xl,
          }}
        >
          <Text
            style={{
              ...FONTS.subheading,
              color: COLORS.contentBrand,
              marginBottom: SIZES.space.lg,
              textAlign: 'center',
            }}
          >
            Contact Information
          </Text>

          <Text
            style={{
              ...FONTS.bodyEmphasis,
              color: COLORS.contentBrand,
              marginBottom: SIZES.space.sm,
              textAlign: 'center',
            }}
          >
            For privacy-related inquiries:
          </Text>
          {email ? (
            <TouchableOpacity onPress={openEmail}>
              <Text
                style={{
                  ...FONTS.body,
                  color: COLORS.contentBrand,
                  textDecorationLine: 'underline',
                  marginBottom: SIZES.space.md,
                }}
              >
                {email}
              </Text>
            </TouchableOpacity>
          ) : null}
          {website ? (
            <TouchableOpacity onPress={openWebsite}>
              <Text
                style={{
                  ...FONTS.bodySm,
                  color: COLORS.contentSecondary,
                  textDecorationLine: 'underline',
                }}
              >
                {website}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicy;
