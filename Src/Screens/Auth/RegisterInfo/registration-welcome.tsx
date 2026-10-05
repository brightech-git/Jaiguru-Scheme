import React from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import theme from "../../../Utills/AppTheme";
import RegisterButton from "../Register/components/RegisterButton";

const { COLORS, FONTS } = theme;

export default function RegistrationWelcomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const username = route.params?.username;

  return (
    <LinearGradient
      colors={COLORS.gradient.accentWash as [string, string, string]}
      style={styles.root}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.accent} />
      <SafeAreaView style={styles.root} edges={[ "bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>

          <View style={styles.emblemRing}>
            <View style={styles.emblem}>
              <MaterialCommunityIcons
                name="gold"
                size={80}
                color={COLORS.contentBrand}
              />
            </View>
            <View style={styles.sparkle}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={26}
                color={COLORS.contentBrand}
              />
            </View>
          </View>

          <Text style={styles.eyebrow}>A GOLDEN BEGINNING</Text>
          <Text style={styles.greeting}>
            {username ? `Welcome, ${username}!` : "Welcome to Jaiguru!"}
          </Text>
          <Text style={styles.title}>
            Your Gold Savings{"\n"}journey begins
          </Text>
          <Text style={styles.description}>
            Every small step brings your dreams closer. Start saving towards
            something precious with Jaiguru.
          </Text>

          <View style={styles.card}>
            <MaterialCommunityIcons
              name="shield-lock-outline"
              size={30}
              color={COLORS.contentBrand}
            />
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>
                One last step: secure your account
              </Text>
              <Text style={styles.cardDescription}>
                Create your personal Golden PIN to keep your account protected.
              </Text>
            </View>
          </View>

          <View style={styles.action}>
            <RegisterButton
              label="Create My G-PIN"
              onPress={() => navigation.replace("MpinCreate")}
            />
            <Text style={styles.footer}>
              Small beginnings. Golden possibilities.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    marginBottom: 30,
  },
  badgeText: {
    fontFamily: FONTS.family.medium,
    fontSize: 13,
    color: COLORS.successText,
  },
  emblemRing: {
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1,
    borderColor: COLORS.accentDeep,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  emblem: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkle: {
    position: "absolute",
    top: 8,
    right: 2,
    backgroundColor: COLORS.accent,
    borderRadius: 22,
    padding: 8,
  },
  eyebrow: {
    fontFamily: FONTS.family.semiBold,
    fontSize: 12,
    letterSpacing: 2.5,
    color: COLORS.contentBrand,
    textAlign: "center",
    marginBottom: 12,
  },
  greeting: {
    fontFamily: FONTS.family.bold,
    fontSize: 18,
    color: COLORS.contentBrand,
    textAlign: "center",
    marginBottom: 10,
  },
  title: {
    fontFamily: FONTS.family.semiBold,
    fontSize: 24,
    lineHeight: 30,
    textAlign: "center",
    color: COLORS.contentBrand,
    marginBottom: 16,
    textTransform: "capitalize",
  },
  description: {
    fontFamily: FONTS.family.regular,
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.contentMuted,
    textAlign: "center",
    marginBottom: 28,
    textTransform: "capitalize",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    width: "100%",
  },
  cardCopy: { flex: 1 },
  cardTitle: {
    fontFamily: FONTS.family.medium,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.contentBrand,
    marginBottom: 5,
    textTransform: "capitalize",
  },
  cardDescription: {
    fontFamily: FONTS.family.regular,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.contentMuted,
    textTransform: "capitalize",
  },
  action: { width: "100%", marginTop: 28 },
  footer: {
    fontFamily: FONTS.family.regular,
    fontSize: 12,
    lineHeight: 19,
    color: COLORS.contentMuted,
    textAlign: "center",
    marginTop: 16,
     textTransform: "capitalize",
  },
});
