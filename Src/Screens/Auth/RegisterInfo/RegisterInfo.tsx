import { Text } from '../../../Components/Typography/FontText';
import React, { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StatusBar, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import theme from "../../../Utills/AppTheme";
import { useToast } from "../../../Components/Toast/Toast";
import { authService } from "../../../api/services/authService";
import LuxuryInput from "../Login/components/LuxuryInput";
import RegisterButton from "../Register/components/RegisterButton";
import { updateUserData } from "../../../Utills/AsynchStorageHelper";

const { COLORS, SIZES, FONTS, ELEVATION } = theme;
const BG_GRADIENT = COLORS.gradient.accentWash as [string, string, string];
const GLOW_GRADIENT = [COLORS.accentSubtle, COLORS.whiteAlpha10] as [
  string,
  string,
];

const RegisterInfoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { userId, contactNumber } = route.params ?? {};
  const { showToast, Toast } = useToast();
  const { width } = useWindowDimensions();
  const [availableHeight, setAvailableHeight] = useState(0);
  const compact = availableHeight > 0 && availableHeight < 720;
  const keyboardLayout = availableHeight > 0 && availableHeight < 520;

  const [username, setUsername] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [termsError, setTermsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!username.trim() || username.trim().length < 3) {
      setUsernameError("Please enter your full name (min 3 characters)");
      return false;
    }
    setUsernameError("");
    if (!termsAccepted) {
      setTermsError(true);
      showToast({
        message: "Please accept the Terms & Conditions to continue",
        type: "warning",
      });
      return false;
    }
    setTermsError(false);
    return true;
  };

  const submit = async () => {
    if (loading) return;
    if (!validate()) return;
    console.log(
      "=== SUBMITTING UPDATE ===",
      JSON.stringify(
        { userId, username: username.trim(), termsAccepted: true },
        null,
        2,
      ),
    );
    try {
      setLoading(true);
      const res: any = await authService.updateUserInfo(userId, {
        username: username.trim(),
        termsAccepted: true,
      });
      console.log(
        "=== UPDATE PAYLOAD ===",
        JSON.stringify(
          { userId, username: username.trim(), termsAccepted: true },
          null,
          2,
        ),
      );
      console.log("=== UPDATE USER RESPONSE ===", JSON.stringify(res, null, 2));

      if (
        res?.status === "success" ||
        res?.message?.toLowerCase().includes("processed")
      ) {
        const storageResult = await updateUserData({ username: username.trim() });
        if (!storageResult.success) {
          throw new Error(storageResult.error || "Unable to save your name. Please try again.");
        }

        Keyboard.dismiss();
        navigation.replace("RegistrationWelcome", { username: username.trim() });
      } else {
        showToast({
          message: res?.message || "Update failed. Please try again.",
          type: "error",
        });
      }
    } catch (err: any) {
      showToast({
        message: err?.message || "Network error. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
        <View
          style={[
            styles.glow,
            {
              width: width * 1.4,
              height: width * 1.4,
              borderRadius: width * 0.7,
              top: -width * 0.55,
            },
          ]}
        >
          <LinearGradient
            colors={GLOW_GRADIENT}
            style={styles.glowFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>
      </View>

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={styles.content}
            onLayout={({ nativeEvent }) =>
              setAvailableHeight(nativeEvent.layout.height)
            }
          >
            {!keyboardLayout && (
              <View style={[styles.welcome, compact && styles.welcomeCompact]}>
                {!compact && (
                  <View style={styles.emblemRing}>
                    <LinearGradient
                      colors={[COLORS.accent, COLORS.accentSubtle]}
                      style={styles.emblem}
                    >
                      <MaterialCommunityIcons
                        name="account-check-outline"
                        size={38}
                        color={COLORS.contentBrand}
                      />
                    </LinearGradient>
                  </View>
                )}
                {/* <Text style={styles.eyebrow}>GOLDEN</Text> */}
                <Text style={styles.title}>A Little More About You</Text>
                <Text style={styles.subtitle}>
                  Make Your Profile Yours. You're One Step Away From Getting
                  Started.
                </Text>
              </View>
            )}

            <View style={styles.cardShadow}>
              <View style={styles.card}>
                {!keyboardLayout && (
                  <LinearGradient
                    colors={[COLORS.brandDeep, COLORS.brand]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.profileBanner,
                      compact && styles.profileBannerCompact,
                    ]}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {username.trim()
                          ? username
                              .trim()
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()
                          : "J"}
                      </Text>
                    </View>
                    <View style={styles.bannerCopy}>
                      <Text style={styles.bannerEyebrow}>PERSONAL PROFILE</Text>
                      <Text numberOfLines={1} style={styles.bannerTitle}>
                        {username.trim() || "Welcome to Jaiguru"}
                      </Text>
                      {/* <Text style={styles.bannerSubtitle}>
                        Your next chapter starts here
                      </Text> */}
                    </View>
                  </LinearGradient>
                )}
                <View
                  style={[styles.formBody, compact && styles.formBodyCompact]}
                >
                  {!keyboardLayout && (
                    <Text style={styles.sectionTitle}>Your details</Text>
                  )}
                  <Text style={styles.fieldLabel}>
                    Full name <Text style={styles.required}>*</Text>
                  </Text>

                  <LuxuryInput
                    icon="account-outline"
                    value={username}
                    onChangeText={(v) => {
                      setUsername(v);
                      if (usernameError) setUsernameError("");
                    }}
                    placeholder="Enter your full name"
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                    textTransform="capitalize"
                    editable={!loading}
                    error={usernameError}
                    accessibilityLabel="Full name"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />

                  {contactNumber && !keyboardLayout ? (
                    <View style={styles.verifiedPanel}>
                      <View style={styles.phoneIcon}>
                        <MaterialCommunityIcons
                          name="cellphone-check"
                          size={22}
                          color={COLORS.contentBrand}
                        />
                      </View>
                      <View style={styles.phoneCopy}>
                        <Text style={styles.phoneLabel}>
                          Verified mobile number
                        </Text>
                        <Text selectable style={styles.phoneNumber}>
                          {String(contactNumber)}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={22}
                        color={COLORS.successText}
                        accessibilityLabel="Verified"
                      />
                    </View>
                  ) : null}

                  {!keyboardLayout && (
                    <View
                      style={[styles.divider, compact && styles.dividerCompact]}
                    />
                  )}
                  <View style={styles.termsRow}>
                    <Pressable
                      onPress={() => {
                        setTermsAccepted((v) => !v);
                        setTermsError(false);
                      }}
                      disabled={loading}
                      accessibilityRole="checkbox"
                      accessibilityLabel="Accept Terms and Conditions"
                      accessibilityState={{
                        checked: termsAccepted,
                        disabled: loading,
                      }}
                      style={styles.checkboxTouch}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          termsAccepted && styles.checkboxChecked,
                          termsError && styles.checkboxError,
                        ]}
                      >
                        {termsAccepted && (
                          <MaterialCommunityIcons
                            name="check"
                            size={SIZES.icon.xs}
                            color={COLORS.contentOnBrand}
                          />
                        )}
                      </View>
                    </Pressable>
                    <Text
                      style={[
                        styles.termsText,
                        termsError && styles.termsTextError,
                      ]}
                    >
                      I Accept the{" "}
                      <Text
                        accessibilityRole="link"
                        style={styles.termsLink}
                        onPress={() => {
                          Keyboard.dismiss();
                          navigation.navigate("TermsAndConditions");
                        }}
                      >
                        Terms & Conditions
                      </Text>
                      <Text style={styles.required}> *</Text>
                    </Text>
                  </View>

                  <View style={styles.buttonWrap}>
                    <RegisterButton
                      label="Joining Now"
                      onPress={submit}
                      loading={loading}
                      success={false}
                    />
                  </View>
                  {!keyboardLayout && (
                    <Text style={styles.actionHint}>
                      Once Complete, Join In To Explore.
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* {!keyboardLayout && (
              <View style={styles.footer}>
                <MaterialCommunityIcons
                  name="shield-lock-outline"
                  size={16}
                  color={COLORS.contentMuted}
                />
                <Text style={styles.footerText}>
                  A thoughtful start to your Jaiguru journey
                </Text>
              </View>
            )} */}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surfacePage },
  flex: { flex: 1 },
  safe: { flex: 1 },
  glow: {
    position: "absolute",
    overflow: "hidden",
  },
  glowFill: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: SIZES.space.gutter,
    paddingTop: SIZES.space.sm,
    paddingBottom: SIZES.space.sm,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  welcome: {
    alignItems: "center",
    marginTop: SIZES.space.xxl,
    marginBottom: SIZES.space.xxl,
  },
  welcomeCompact: { marginTop: 16, marginBottom: 16 },
  profileBannerCompact: { paddingVertical: 14 },
  formBodyCompact: { paddingVertical: 16 },
  dividerCompact: { marginVertical: 12 },
  title: {
    fontFamily: FONTS.family.bold,
    fontSize: 29,
    lineHeight: 37,
    textAlign: "center",
    letterSpacing: -0.8,
    color: COLORS.contentPrimary,
  },
  subtitle: {
    fontFamily: FONTS.family.semiBold,
    fontSize: 14,
    lineHeight: SIZES.text.md * 1.5,
    textAlign: "center",
    color: COLORS.contentSecondary,
    marginTop: SIZES.space.xs,
    maxWidth: 300,
  },
  cardShadow: {
    borderRadius: SIZES.radius.xxl,
    ...ELEVATION.floating,
    shadowColor: COLORS.shadowAccent,
  },
  card: {
    borderRadius: SIZES.radius.xxl,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.accentAlpha32,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: SIZES.space.sm,
  },
  checkbox: {
    width: SIZES.icon.md,
    height: SIZES.icon.md,
    borderRadius: SIZES.radius.xs,
    borderWidth: 1.5,
    borderColor: COLORS.borderAccent,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  checkboxChecked: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.borderBrand,
  },
  termsText: {
    fontFamily: FONTS.family.medium,
    fontSize: 13,
    lineHeight: 22,
    paddingTop: 10,
    color: COLORS.contentSecondary,
    flex: 1,
  },
  termsLink: {
    fontFamily: FONTS.family.semiBold,
    color: COLORS.contentBrand,
  },
  checkboxError: {
    borderColor: "#E53935",
  },
  termsTextError: {
    color: COLORS.dangerText,
  },
  required: {
    color: COLORS.dangerText,
    fontFamily: FONTS.family.bold,
  },
  buttonWrap: { marginTop: SIZES.space.lg },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  progressStep: { flexDirection: "row", alignItems: "center", gap: 6 },
  progressLabel: {
    fontFamily: FONTS.family.medium,
    fontSize: 12,
    color: COLORS.contentBrand,
  },
  progressLine: { flex: 1, height: 1, backgroundColor: COLORS.accentSubtle },
  stepBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.brandAlpha08,
  },
  stepText: {
    fontFamily: FONTS.family.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.contentBrand,
  },
  emblemRing: {
    padding: 7,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: COLORS.accentSubtle,
    marginBottom: 18,
  },
  emblem: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontFamily: FONTS.family.bold,
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.contentBrand,
    marginBottom: 10,
  },
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 22,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.whiteAlpha20,
    borderWidth: 1,
    borderColor: COLORS.whiteAlpha50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: FONTS.family.bold,
    fontSize: 22,
    color: COLORS.contentOnBrand,
  },
  bannerCopy: { flex: 1, gap: 4 },
  bannerEyebrow: {
    fontFamily: FONTS.family.semiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: COLORS.contentOnBrand,
  },
  bannerTitle: {
    fontFamily: FONTS.family.bold,
    fontSize: 18,
    color: COLORS.contentOnBrand,
    textTransform: 'capitalize',
  },
  bannerSubtitle: {
    fontFamily: FONTS.family.semiBold,
    fontSize: 13,
    color: COLORS.contentOnBrand,
  },
  formBody: { padding: 22 },
  sectionTitle: {
    fontFamily: FONTS.family.bold,
    fontSize: 16,
    color: COLORS.contentPrimary,
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: FONTS.family.semiBold,
    fontSize: 12,
    color: COLORS.contentSecondary,
    marginBottom: 8,
  },
  verifiedPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.accentTint,
    borderWidth: 1,
    borderColor: COLORS.accentSubtle,
  },
  phoneIcon: {
    width: 36,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneCopy: { flex: 1, gap: 4 },
  phoneLabel: {
    fontFamily: FONTS.family.medium,
    fontSize: 11,
    color: COLORS.contentSecondary,
  },
  phoneNumber: {
    fontFamily: FONTS.family.semiBold,
    fontSize: 15,
    color: COLORS.contentPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: 22,
  },
  checkboxTouch: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  actionHint: {
    fontFamily: FONTS.family.regular,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    color: COLORS.contentMuted,
    marginTop: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  footerText: {
    fontFamily: FONTS.family.medium,
    fontSize: 11,
    color: COLORS.contentMuted,
    flexShrink: 1,
  },
});

export default RegisterInfoScreen;
