import React, { useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppText } from "../../../Components/ui/appcomponents";
import theme from "../../../Utills/AppTheme";

const { COLORS, SIZES } = theme;
const GOLD_GRADIENT = ["#C9A55B","#DBBD79","#F4E2A4","#D3AE62","#C39A4F","#fae59f","#D8B56F","#B98D3D"] as const;
const NA = "Not available";

export interface MemberKycInfo {
  name?: string;
  address?: string;
  aadhaarNo?: string;
  mobile?: string;
  aadhaarKyc?: boolean;
  addressKyc?: boolean;
  onAddressKyc?: () => void;
  onAadhaarKyc?: () => void;
}

function KycRow({
  label, value, kycDone, showKyc, onKyc,
}: {
  label: string; value: string; kycDone?: boolean; showKyc?: boolean; onKyc?: () => void;
}) {
  return (
    <View style={styles.kycRow}>
      <View style={styles.kycRowLeft}>
        <AppText variant="caption" color={COLORS.contentPrimary}>{label}</AppText>
        <AppText variant="captionBold" color={value === NA ? COLORS.contentPrimary : COLORS.contentOnAccent}>
          {value}
        </AppText>
      </View>
      {showKyc && (
        kycDone ? (
          <View style={styles.kycDone}>
            <AppText variant="captionBold" color={COLORS.successText}>✓ Verified</AppText>
          </View>
        ) : (
          <TouchableOpacity style={styles.kycPending} onPress={onKyc}>
            <AppText variant="captionBold" color={COLORS.white}>KYC Pending</AppText>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

export default function SchemeNameCarousel({
  names,
  children,
  memberName,
  mobileNumber,
  memberKyc,
  cardHeight,
  matchMemberCardHeight = false,
}: {
  names: { rows: { label: string; value: string }[] }[];
  children: React.ReactNode;
  memberName?: string;
  mobileNumber?: string;
  memberKyc?: MemberKycInfo;
  cardHeight?: number;
  matchMemberCardHeight?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
  const [slideHeights, setSlideHeights] = useState<Record<number, number>>({});

  const totalSlides = 1 + (memberKyc ? 1 : 0) + names.length;
  const measured = cardHeight != null || Object.keys(slideHeights).length === totalSlides;
  const maxHeight = cardHeight ?? (measured
    ? matchMemberCardHeight && memberKyc ? slideHeights[1] : Math.max(...Object.values(slideHeights))
    : undefined);
  const fullHeightChildren = React.Children.map(children, (child) =>
    React.isValidElement<{ style?: StyleProp<ViewStyle> }>(child)
      ? React.cloneElement(child, {
          style: [child.props.style, { height: maxHeight }],
        })
      : child,
  );

  const onSlideLayout = (index: number) => (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setSlideHeights((prev) => prev[index] === h ? prev : { ...prev, [index]: h });
  };

  const kycSlide = (
    <LinearGradient colors={GOLD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[styles.card, maxHeight ? { height: maxHeight } : undefined]}>
      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: SIZES.space.sm }}>
      <KycRow label="Name" value={memberKyc?.name || NA} />
      <View style={styles.divider} />
      <KycRow label="Address" value={memberKyc?.address || NA} showKyc kycDone={memberKyc?.addressKyc} onKyc={memberKyc?.onAddressKyc} />
      <View style={styles.divider} />
      <KycRow label="Aadhaar No." value={memberKyc?.aadhaarNo || NA} showKyc kycDone={memberKyc?.aadhaarKyc} onKyc={memberKyc?.onAadhaarKyc} />
      <View style={styles.divider} />
      <KycRow label="Mobile" value={memberKyc?.mobile || NA} />
      </ScrollView>
    </LinearGradient>
  );

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {/* Hidden measurement pass */}
      {width > 0 && !measured && (
        <View style={{ position: "absolute", opacity: 0, width, zIndex: -1 }} pointerEvents="none">
          <View onLayout={onSlideLayout(0)}>{children}</View>
          {memberKyc && <View onLayout={onSlideLayout(1)}>{kycSlide}</View>}
          {names.map((item, i) => (
            <View key={i} onLayout={onSlideLayout(2 + i)}>
              <LinearGradient colors={GOLD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
                {item.rows.map((row) => (
                  <View key={row.label} style={styles.row}>
                    <AppText variant="caption" color={COLORS.contentSecondary}>{row.label}</AppText>
                    <AppText variant="captionBold" color={COLORS.contentOnAccent}>{row.value}</AppText>
                  </View>
                ))}
              </LinearGradient>
            </View>
          ))}
        </View>
      )}

      {/* Actual carousel — only shown after measurement */}
      {width > 0 && measured && (
        <ScrollView
          key={`${width}-${maxHeight}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ width, overflow: "hidden" }}
          onMomentumScrollEnd={(e) =>
            setActive(Math.round(e.nativeEvent.contentOffset.x / width))
          }
        >
          <View style={{ width, height: maxHeight }}>{fullHeightChildren}</View>

          {memberKyc && (
            <View style={{ width, height: maxHeight }}>{kycSlide}</View>
          )}

          {names.map((item, i) => (
            <View key={i} style={{ width, height: maxHeight }}>
              <LinearGradient
                colors={GOLD_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, { height: maxHeight }]}
              >
                {item.rows.map((row) => (
                  <View key={row.label} style={styles.row}>
                    <AppText variant="caption" color={COLORS.contentSecondary}>{row.label}</AppText>
                    <AppText variant="captionBold" color={COLORS.contentOnAccent}>{row.value}</AppText>
                  </View>
                ))}
              </LinearGradient>
            </View>
          ))}
        </ScrollView>
      )}

      {totalSlides > 1 && (
        <View style={styles.dots}>
          {Array.from({ length: totalSlides }, (_, index) => (
            <View
              key={index}
              style={[styles.dot, index === Math.min(active, totalSlides - 1) && styles.active]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    justifyContent: "center",
    gap: SIZES.space.sm,
    padding: SIZES.space.xl,
    borderRadius: SIZES.radius.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kycRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SIZES.space.sm,
  },
  kycRowLeft: { flex: 1, gap: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(0,0,0,0.12)" },
  kycPending: {
    backgroundColor: COLORS.warning,
    borderRadius: SIZES.radius.pill,
    paddingHorizontal: SIZES.space.md,
    paddingVertical: SIZES.space.xs,
  },
  kycDone: {
    backgroundColor: COLORS.successSurface,
    borderRadius: SIZES.radius.pill,
    paddingHorizontal: SIZES.space.md,
    paddingVertical: SIZES.space.xs,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SIZES.space.xs,
    marginTop: SIZES.space.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.borderStrong,
  },
  active: { width: 18, backgroundColor: COLORS.brand },
});
