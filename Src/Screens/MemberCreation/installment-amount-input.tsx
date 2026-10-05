import React, { useState } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import Animated, { cubicBezier, useReducedMotion } from "react-native-reanimated";
import { AppText } from "../../Components/ui/appcomponents";
import { useTodayRate } from "../../api/hooks/Rates/useTodayRate";
import theme from "../../Utills/AppTheme";

const { COLORS, SIZES, FONTS } = theme;
const AMOUNTS = Array.from({ length: 10 }, (_, index) => (index + 1) * 1000);

export const isValidInstallmentAmount = (value: string): boolean => {
  const amount = Number(value);
  return (
    /^\d+$/.test(value) &&
    Number.isSafeInteger(amount) &&
    amount > 0 &&
    amount % 1000 === 0
  );
};

interface Props {
  value: string;
  onChange: (value: string) => void;
  metalType?: string;
}

export default function InstallmentAmountInput({
  value,
  onChange,
  metalType,
}: Props) {
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const { rates, loading, error } = useTodayRate();
  const metal = metalType?.trim().toUpperCase();
  const isGold = metal === "G" || metal === "GOLD";
  const isSilver = metal === "S" || metal === "SILVER";
  const rawRate = isGold
    ? rates?.GOLDRATE
    : isSilver
      ? rates?.SILVERRATE
      : undefined;
  const rate = Number(
    typeof rawRate === "string"
      ? String(rawRate).replace(/,/g, "").trim()
      : rawRate,
  );
  const valid = isValidInstallmentAmount(value);
  const invalid = value.length > 0 && !valid;
  const weight =
    valid && Number.isFinite(rate) && rate > 0 ? Number(value) / rate : null;
  const weightHint =
    !isGold && !isSilver
      ? "Weight needs a gold or silver metal type for this scheme."
      : loading
        ? "Loading today’s rate to calculate weight."
        : error
          ? "Could not load today’s rate. Weight is unavailable."
          : !Number.isFinite(rate) || rate <= 0
            ? "Today’s rate is unavailable for this metal."
            : "Weight is estimated at today’s rate.";

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.amountColumn}>
          <AppText variant="captionBold" style={styles.label}>
            Amount (₹)
          </AppText>
          <TextInput
            value={value}
            onChangeText={(text) => {
              if (/^\d*$/.test(text)) onChange(text);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            keyboardType="number-pad"
            placeholder="1000"
            placeholderTextColor={COLORS.contentDisabled}
            maxLength={10}
            selectionColor={COLORS.brand}
            accessibilityLabel="Installment amount in rupees"
            accessibilityHint="Enter a positive multiple of 1000"
            style={[
              styles.field,
              styles.input,
              focused && styles.focused,
              invalid && styles.invalid,
            ]}
          />
        </View>
        <View style={styles.weightColumn}>
          <AppText variant="captionBold" style={styles.label}>
            Weight (g)
          </AppText>
          <View
            style={[styles.field, styles.weight]}
            accessibilityLabel="Estimated weight in grams"
          >
            <AppText variant="bodyMedium" numberOfLines={1}>
              {weight !== null
                ? `${weight.toFixed(3)} g`
                : loading
                  ? "Loading…"
                  : rate > 0
                    ? "0"
                    : "Unavailable"}
            </AppText>
          </View>
        </View>
      </View>
      <AppText
        variant="captionBold"
        color={invalid ? COLORS.dangerText : COLORS.contentMuted}
        style={styles.hint}
      >
        {invalid
          ? "Enter a positive amount in multiples of ₹1,000."
          : "Multiples of ₹1,000 only."}
      </AppText>
      <AppText
        variant="captionBold"
        color={COLORS.contentMuted}
        style={styles.hint}
      >
        {weightHint}
      </AppText>
      <View style={styles.tags}>
        {AMOUNTS.map((amount) => {
          const selected = Number(value) === amount;
          const popular = amount === 3000 || amount === 5000;
          return (
            <Animated.View
              key={amount}
              style={popular && !reducedMotion ? {
                animationName: { from: { opacity: 1 }, '50%': { opacity: 0.6 }, to: { opacity: 1 } },
                animationDuration: 1600,
                animationIterationCount: 'infinite',
                animationTimingFunction: cubicBezier(0.77, 0, 0.175, 1),
              } : undefined}
            >
            <Pressable
              onPress={() => onChange(String(amount))}
              accessibilityRole="button"
              accessibilityLabel={`Select ${amount} rupees${popular ? ', Most saved' : ''}`}
              accessibilityState={{ selected }}
              style={[
                styles.tag,
                popular && styles.popularTag,
                selected && styles.selectedTag,
                styles.tagContent,
              ]}
            >
              <AppText
                variant="captionBold"
                color={
                  selected
                    ? COLORS.contentOnBrand
                    : popular
                      ? COLORS.successText
                      : COLORS.contentBrand
                }
              >
                ₹{amount.toLocaleString("en-IN")}
              </AppText>
              {popular && (
                <View pointerEvents="none" style={styles.savedBadge}>
                  <AppText variant="captionBold" color={COLORS.contentOnBrand} style={styles.badgeText}>
                    Most saved
                  </AppText>
                </View>
              )}
            </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: SIZES.space.sm },
  amountColumn: { flex: 3, minWidth: 0 },
  weightColumn: { flex: 2, minWidth: 0 },
  label: { marginBottom: SIZES.space.xs },
  field: {
    height: SIZES.field.height,
    borderWidth: 1,
    borderColor: COLORS.fieldBorder,
    borderRadius: SIZES.radius.field,
    paddingHorizontal: SIZES.space.md,
    backgroundColor: COLORS.fieldBackground,
  },
  input: {
    fontFamily: FONTS.family.bold,
    fontSize: SIZES.text.lg,
    color: COLORS.contentPrimary,
  },
  focused: { borderColor: COLORS.fieldBorderFocused },
  invalid: { borderColor: COLORS.danger },
  weight: { justifyContent: "center", backgroundColor: COLORS.surfaceSunken },
  hint: { marginTop: SIZES.space.sm },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.space.sm,
    rowGap: SIZES.space.lg,
    marginTop: SIZES.space.md,
    paddingTop: SIZES.space.sm,
  },
  tag: {
    paddingHorizontal: SIZES.space.md,
    paddingVertical: SIZES.space.sm,
    borderRadius: SIZES.radius.pill,
    borderWidth: 1,
    borderColor: COLORS.brandAlpha32,
    backgroundColor: COLORS.brandTint,
  },
  selectedTag: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  tagContent: { alignItems: "center", justifyContent: "center" },
  savedBadge: {
    position: "absolute",
    top: -17,
    alignSelf: "center",
    paddingHorizontal: SIZES.space.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.successText,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  badgeText: { fontSize: SIZES.text.xxs, lineHeight: SIZES.text.xs },
  popularTag: {
    minWidth: 90,
    paddingTop: SIZES.space.md,
    backgroundColor: COLORS.brandTint,
    borderColor: COLORS.successText,
  },
});
