import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppText } from "../../../Components/ui/appcomponents";
import theme from "../../../Utills/AppTheme";

const { COLORS, SIZES } = theme;
export default function SchemeNameCarousel({
  names,
  children,
  memberName,
  mobileNumber,
}: {
  names: { rows: { label: string; value: string }[] }[];
  children: React.ReactNode;
  memberName?: string;
  mobileNumber?: string;
}) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
  const count = names.length + 1;
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <ScrollView
          key={width}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) =>
            setActive(Math.round(event.nativeEvent.contentOffset.x / width))
          }
        >
          <View style={{ width }}>{children}</View>
          {names.map((item, i) => (
            <View key={i} style={{ width }}>
              <LinearGradient
                colors={COLORS.gradient.brandDeep as [string, string]}
                style={styles.card}
              >
                {item.rows.map((row) => (
                  <View key={row.label} style={styles.row}>
                    <AppText variant="caption" color={COLORS.whiteAlpha80}>
                      {row.label}
                    </AppText>
                    <AppText variant="captionBold" color={COLORS.contentOnBrand}>
                      {row.value}
                    </AppText>
                  </View>
                ))}
              </LinearGradient>
            </View>
          ))}
        </ScrollView>
      )}
      {count > 1 && (
        <View style={styles.dots}>
          {Array.from({ length: count }, (_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === Math.min(active, count - 1) && styles.active,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 110,
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
