// theme.ts
import { Dimensions, PixelRatio, Platform } from "react-native";
import { BOLD, BODY } from "./Fonts";

const { width, height } = Dimensions.get("window");

/* ============================================================
   RESPONSIVE SCALING
   ============================================================ */
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number): number => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number): number =>
  (height / guidelineBaseHeight) * size;

const moderateScale = (size: number, factor: number = 0.25): number =>
  size + (scale(size) - size) * factor;

const fontScale = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel(moderateScale(size, 0.2)));

/* ============================================================
   PALETTE — raw values live here and nowhere else.
   Change a hex here and the whole app follows.
   ============================================================ */
const PALETTE = {
  // Magenta ramp (brand) — derived from #80004D
  magenta900: "#46002A",
  magenta800: "#64003C",
  magenta700: "#80004D", // ← brand / primary
  magenta500: "#A4477F",
  magenta300: "#C68CAF",
  magenta100: "#EBD6E3",
  magenta050: "#F9F4F7",

  // Cream ramp (accent) — anchored on #FFF2D8.
  // NOTE: these are SURFACE colours only. Never use them as text or icon
  // colours — #FFF2D8 on white is 1.1:1 and effectively invisible.
  cream050: "#FFF8E1",
  cream100: "#F8EDC2",
  cream200: "#ECD98A",
  cream400: "#D4AF37", // main gold

  // Neutrals
  ink: "#14161F",
  slate700: "#3C4152",
  slate500: "#6B7280",
  slate400: "#9CA3AF", // decorative only — fails 4.5:1, never use for text
  slate450: "#5E6471", // placeholder/muted text that must clear 4.5:1 on tinted fields
  slate300: "#D2D6DE",
  slate200: "#E6E9EF",
  slate100: "#F1F3F7",
  slate050: "#F8F9FC",
  white: "#FFFFFF",
  black: "#000000",

  // States. The base tone is the FILL colour and is unchanged — it only ever
  // needs 3:1 (icons, borders, chips). The `*Text` tone is a darker sibling for
  // when the same state is rendered AS TEXT on a light surface (needs 4.5:1),
  // and `*OnDark` is the lighter sibling for text on `surfaceInverse`.
  green: "#128A5E",
  greenSoft: "#E4F5EE",
  greenText: "#0F714D",
  greenOnDark: "#139364",
  red: "#C62828",
  redSoft: "#FCEAEA",
  redText: "#C62828", // already clears 4.5:1 on every light surface
  redOnDark: "#DD5353",
  orange: "#B7791F",
  orangeSoft: "#FDF3E2",
  orangeText: "#875A17",
  orangeOnDark: "#B1761E",
  blue: "#1F6FD0",
  blueSoft: "#E8F1FC",
  blueText: "#1C63B9",
  blueOnDark: "#3381E0",
};

/* ============================================================
   ALPHA HELPER
   Every translucent colour below is COMPUTED from a PALETTE hex,
   so changing a hex in PALETTE updates the scrims, shadows and
   overlays too. Never hand-write an rgba() string in this file.
   ============================================================ */
const withAlpha = (hex: string, alpha: number): string => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/* ============================================================
   COLORS — semantic roles. Use these in components.
   ============================================================ */
export const COLORS = {
  /* --- Brand (main identity, headers, primary actions, ALL text & icons) --- */
  brand: PALETTE.magenta700,
  brandStrong: PALETTE.magenta800, // pressed / hover state
  brandDeep: PALETTE.magenta900, // dark hero sections
  brandMuted: PALETTE.magenta500, // secondary brand elements
  brandSoft: PALETTE.magenta300, // disabled brand, illustrations
  brandSubtle: PALETTE.magenta100, // chips, selected rows
  brandTint: PALETTE.magenta050, // section backgrounds

  /* --- Accent (cream SURFACES only — never text; see PALETTE note) --- */
  accent: PALETTE.cream050, // filled cream panels, badges
  accentStrong: PALETTE.cream200, // pressed state
  accentDeep: PALETTE.cream400, // deepest cream, borders on cream
  accentSoft: PALETTE.cream100,
  accentSubtle: PALETTE.cream200, // borders, dividers
  accentTint: PALETTE.cream050, // callout backgrounds

  /* --- Surfaces (anything you place content on) --- */
  surface: PALETTE.white, // cards, sheets
  surfacePage: PALETTE.white, // screen background
  surfaceMuted: PALETTE.slate050, // grouped list background
  surfaceSunken: PALETTE.slate100, // input wells, skeletons
  surfaceBrand: PALETTE.magenta700, // filled brand panels
  surfaceInverse: PALETTE.ink, // dark panels, toasts

  /* --- Content (text & icons) --- */
  contentPrimary: PALETTE.ink,
  contentSecondary: PALETTE.slate700,
  contentMuted: PALETTE.slate500,
  contentPlaceholder: PALETTE.slate450, // slate400 fails 4.5:1; placeholders are text
  contentDisabled: PALETTE.slate300,
  contentOnBrand: PALETTE.white, // text sitting on `brand` — 10.4:1
  contentOnAccent: PALETTE.magenta700, // text sitting on cream — 9.4:1
  contentOnInverse: PALETTE.white,
  contentBrand: PALETTE.magenta700, // links, active tab labels
  contentAccent: PALETTE.magenta700, // cream can't be text; accent text = brand

  /* --- Lines --- */
  border: PALETTE.slate200,
  borderSubtle: PALETTE.slate100,
  borderStrong: PALETTE.slate300,
  borderBrand: PALETTE.magenta700,
  borderAccent: PALETTE.cream400,
  divider: PALETTE.slate200,

  /* --- Fields --- */
  fieldBackground: PALETTE.slate050,
  fieldBorder: PALETTE.slate200,
  fieldBorderFocused: PALETTE.magenta700,
  fieldBorderError: PALETTE.red,

  /* --- Feedback states --- */
  success: PALETTE.green,
  successSurface: PALETTE.greenSoft,
  danger: PALETTE.red,
  dangerSurface: PALETTE.redSoft,
  warning: PALETTE.orange,
  warningSurface: PALETTE.orangeSoft,
  info: PALETTE.blue,
  infoSurface: PALETTE.blueSoft,

  /* --- State colours rendered AS TEXT on a light surface. Use these instead
         of `success`/`danger`/`warning`/`info` whenever the colour lands on a
         Text node; the base tones are fills and only guarantee 3:1. --- */
  successText: PALETTE.greenText,
  dangerText: PALETTE.redText,
  warningText: PALETTE.orangeText,
  infoText: PALETTE.blueText,

  /* --- State colours on dark surfaces (toasts, inverse panels). --- */
  successOnInverse: PALETTE.greenOnDark,
  dangerOnInverse: PALETTE.redOnDark,
  warningOnInverse: PALETTE.orangeOnDark,
  infoOnInverse: PALETTE.blueOnDark,

  /* --- Absolute neutrals (use sparingly; prefer surface/content roles) --- */
  white: PALETTE.white,
  black: PALETTE.black,

  /* --- Scrims & transparency --- */
  scrim: withAlpha(PALETTE.ink, 0.55), // behind modals
  scrimHeavy: withAlpha(PALETTE.ink, 0.78), // scrims that carry white text/spinners
  scrimBrand: withAlpha(PALETTE.magenta700, 0.72), // brand-tinted image overlay
  scrimLight: withAlpha(PALETTE.white, 0.85),
  transparent: "transparent",

  whiteAlpha10: withAlpha(PALETTE.white, 0.1),
  whiteAlpha20: withAlpha(PALETTE.white, 0.2),
  whiteAlpha50: withAlpha(PALETTE.white, 0.5),
  whiteAlpha70: withAlpha(PALETTE.white, 0.7),
  whiteAlpha80: withAlpha(PALETTE.white, 0.8),
  whiteAlpha90: withAlpha(PALETTE.white, 0.9),

  brandAlpha08: withAlpha(PALETTE.magenta700, 0.08),
  brandAlpha16: withAlpha(PALETTE.magenta700, 0.16),
  brandAlpha32: withAlpha(PALETTE.magenta700, 0.32),
  // Warm tan alphas taken from the deep end of the cream ramp — the cream
  // itself is too light to register as an overlay.
  accentAlpha08: withAlpha(PALETTE.cream400, 0.14),
  accentAlpha16: withAlpha(PALETTE.cream400, 0.26),
  accentAlpha32: withAlpha(PALETTE.cream400, 0.45),
  inkAlpha08: withAlpha(PALETTE.ink, 0.08),
  inkAlpha16: withAlpha(PALETTE.ink, 0.16),
  inkAlpha40: withAlpha(PALETTE.ink, 0.4),

  /* --- Shadow tints --- */
  shadowNeutral: withAlpha(PALETTE.ink, 0.18),
  shadowBrand: withAlpha(PALETTE.magenta700, 0.28),
  shadowAccent: withAlpha(PALETTE.magenta700, 0.18), // cream casts no usable shadow

  /* --- Gradients --- */
  gradient: {
    brand: [PALETTE.magenta700, PALETTE.magenta500],
    brandDeep: [PALETTE.magenta900, PALETTE.magenta700],
    accent: [PALETTE.cream050, PALETTE.cream200],
    accentDeep: [PALETTE.cream100, PALETTE.cream400],
    signature: [PALETTE.magenta700, PALETTE.cream050], // the brand pairing
    signatureDeep: [PALETTE.magenta900, PALETTE.magenta700, PALETTE.cream050],
    pageWash: [PALETTE.white, PALETTE.magenta050],
    accentWash: [PALETTE.white, PALETTE.cream050],
    fadeToDark: [withAlpha(PALETTE.ink, 0), withAlpha(PALETTE.ink, 0.85)], // image captions
    shine: [
      withAlpha(PALETTE.white, 0),
      withAlpha(PALETTE.white, 0.7),
      withAlpha(PALETTE.white, 0),
    ],
  } as Record<string, string[]>,
};

/* ============================================================
   SIZES
   ============================================================ */
export const SIZES = {
  base: 16,

  space: {
    xs: moderateScale(4),
    sm: moderateScale(8),
    md: moderateScale(12),
    lg: moderateScale(16),
    xl: moderateScale(20),
    xxl: moderateScale(24),
    xxxl: moderateScale(32),
    huge: moderateScale(48),
    gutter: moderateScale(20), // screen edge padding
  },

  radius: {
    xs: moderateScale(4),
    sm: moderateScale(8),
    md: moderateScale(12),
    lg: moderateScale(16),
    xl: moderateScale(20),
    xxl: moderateScale(28),
    pill: 9999,
    card: moderateScale(16),
    control: moderateScale(12),
    field: moderateScale(10),
  },

  text: {
    xxs: fontScale(10),
    xs: fontScale(11),
    sm: fontScale(12),
    md: fontScale(14),
    lg: fontScale(16),
    xl: fontScale(18),
    xxl: fontScale(20),
    display1: fontScale(32),
    display2: fontScale(28),
    display3: fontScale(24),
  },

  icon: {
    xs: moderateScale(12),
    sm: moderateScale(16),
    md: moderateScale(20),
    lg: moderateScale(24),
    xl: moderateScale(28),
    xxl: moderateScale(32),
    avatar: moderateScale(48),
    avatarLg: moderateScale(64),
  },

  control: {
    heightSm: moderateScale(36),
    heightMd: moderateScale(48),
    heightLg: moderateScale(56),
  },

  field: {
    height: moderateScale(48),
  },

  screen: {
    width,
    height,
    isCompact: width < 375,
    isRegular: width >= 375 && width < 768,
    isTablet: width >= 768,
  },

  appBarHeight: Platform.OS === "ios" ? moderateScale(88) : moderateScale(56),
  tabBarHeight: Platform.OS === "ios" ? moderateScale(84) : moderateScale(60),
};

/* ============================================================
   TYPOGRAPHY (Poppins Bold / Inter Display Medium)
   ============================================================ */
export const FONTS: Record<string, any> = {
  family: {
    light: BODY,
    regular: BODY,
    medium: BODY,
    semiBold: BOLD,
    bold: BOLD,
  },

  weight: {
    light: "300",
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
  },

  display: {
    fontFamily: BOLD,
    fontSize: SIZES.text.display1,
    lineHeight: SIZES.text.display1 * 1.2,
    color: COLORS.contentPrimary,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: BOLD,
    fontSize: SIZES.text.display3,
    lineHeight: SIZES.text.display3 * 1.28,
    color: COLORS.contentPrimary,
    letterSpacing: -0.3,
  },
  heading: {
    fontFamily: BOLD,
    fontSize: SIZES.text.xxl,
    lineHeight: SIZES.text.xxl * 1.3,
    color: COLORS.contentPrimary,
  },
  subheading: {
    fontFamily: BOLD,
    fontSize: SIZES.text.lg,
    lineHeight: SIZES.text.lg * 1.4,
    color: COLORS.contentPrimary,
  },
  // Restores the pre-migration h2 / h5 steps of the heading scale.
  display2: {
    fontFamily: BOLD,
    fontSize: SIZES.text.display2,
    lineHeight: SIZES.text.display2 * 1.25,
    color: COLORS.contentPrimary,
    letterSpacing: -0.3,
  },
  subheadingLg: {
    fontFamily: BODY,
    fontSize: SIZES.text.xl,
    lineHeight: SIZES.text.xl * 1.4,
    color: COLORS.contentPrimary,
  },

  bodyLg: {
    fontFamily: BODY,
    fontSize: SIZES.text.lg,
    lineHeight: SIZES.text.lg * 1.5,
    color: COLORS.contentPrimary,
  },
  body: {
    fontFamily: BODY,
    fontSize: SIZES.text.md,
    lineHeight: SIZES.text.md * 1.5,
    color: COLORS.contentPrimary,
  },
  bodyEmphasis: {
    fontFamily: BODY,
    fontSize: SIZES.text.md,
    lineHeight: SIZES.text.md * 1.5,
    color: COLORS.contentPrimary,
  },
  // Genuinely bold body copy — `bodyEmphasis` is only Medium.
  bodyStrong: {
    fontFamily: BOLD,
    fontSize: SIZES.text.md,
    lineHeight: SIZES.text.md * 1.5,
    color: COLORS.contentPrimary,
  },
  bodySm: {
    fontFamily: BODY,
    fontSize: SIZES.text.sm,
    lineHeight: SIZES.text.sm * 1.5,
    color: COLORS.contentSecondary,
  },

  label: {
    fontFamily: BOLD,
    fontSize: SIZES.text.sm,
    lineHeight: SIZES.text.sm * 1.4,
    color: COLORS.contentPrimary,
    letterSpacing: 0.3,
  },
  eyebrow: {
    fontFamily: BOLD,
    fontSize: SIZES.text.xs,
    lineHeight: SIZES.text.xs * 1.4,
    color: COLORS.contentAccent,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  caption: {
    fontFamily: BODY,
    fontSize: SIZES.text.xs,
    lineHeight: SIZES.text.xs * 1.4,
    color: COLORS.contentMuted,
  },

  action: {
    fontFamily: BOLD,
    fontSize: SIZES.text.md,
    lineHeight: SIZES.text.md * 1.3,
    letterSpacing: 0.3,
  },
  actionSm: {
    fontFamily: BODY,
    fontSize: SIZES.text.sm,
    lineHeight: SIZES.text.sm * 1.3,
  },
};

/* ============================================================
   ELEVATION
   ============================================================ */
export const ELEVATION: Record<string, any> = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  raised: {
    shadowColor: COLORS.shadowNeutral,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  floating: {
    shadowColor: COLORS.shadowNeutral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  overlay: {
    shadowColor: COLORS.shadowNeutral,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  brandGlow: {
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  accentGlow: {
    shadowColor: COLORS.shadowAccent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

/* ============================================================
   COMPONENT STYLES
   ============================================================ */
export const STYLES: Record<string, any> = {
  screen: {
    flex: 1,
    backgroundColor: COLORS.surfacePage,
  },
  screenPadded: {
    flex: 1,
    backgroundColor: COLORS.surfacePage,
    paddingHorizontal: SIZES.space.gutter,
  },
  screenMuted: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
  },

  /* --- Buttons --- */
  action: {
    // Filled indigo — the main call to action
    primary: {
      backgroundColor: COLORS.brand,
      borderRadius: SIZES.radius.control,
      height: SIZES.control.heightMd,
      paddingHorizontal: SIZES.space.xxl,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      ...ELEVATION.raised,
    },
    // Filled amber — secondary emphasis / highlight actions
    accent: {
      backgroundColor: COLORS.accent,
      borderRadius: SIZES.radius.control,
      height: SIZES.control.heightMd,
      paddingHorizontal: SIZES.space.xxl,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      ...ELEVATION.accentGlow,
    },
    // Indigo outline
    outline: {
      backgroundColor: COLORS.transparent,
      borderRadius: SIZES.radius.control,
      height: SIZES.control.heightMd,
      paddingHorizontal: SIZES.space.xxl,
      borderWidth: 1.5,
      borderColor: COLORS.borderBrand,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    // Tinted, low emphasis
    subtle: {
      backgroundColor: COLORS.brandTint,
      borderRadius: SIZES.radius.control,
      height: SIZES.control.heightMd,
      paddingHorizontal: SIZES.space.xxl,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    // Text only
    ghost: {
      backgroundColor: COLORS.transparent,
      height: SIZES.control.heightSm,
      paddingHorizontal: SIZES.space.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    disabled: {
      backgroundColor: COLORS.surfaceSunken,
      borderRadius: SIZES.radius.control,
      height: SIZES.control.heightMd,
      paddingHorizontal: SIZES.space.xxl,
      alignItems: "center",
      justifyContent: "center",
    },
  },

  /* --- Fields --- */
  field: {
    base: {
      height: SIZES.field.height,
      borderWidth: 1,
      borderColor: COLORS.fieldBorder,
      borderRadius: SIZES.radius.field,
      paddingHorizontal: SIZES.space.lg,
      fontSize: SIZES.text.md,
      fontFamily: FONTS.family.regular,
      color: COLORS.contentPrimary,
      backgroundColor: COLORS.fieldBackground,
    },
    focused: {
      borderColor: COLORS.fieldBorderFocused,
      borderWidth: 1.5,
      backgroundColor: COLORS.surface,
    },
    invalid: {
      borderColor: COLORS.fieldBorderError,
      backgroundColor: COLORS.surface,
    },
  },

  /* --- Cards --- */
  card: {
    base: {
      backgroundColor: COLORS.surface,
      borderRadius: SIZES.radius.card,
      padding: SIZES.space.lg,
      borderWidth: 1,
      borderColor: COLORS.borderSubtle,
    },
    raised: {
      backgroundColor: COLORS.surface,
      borderRadius: SIZES.radius.card,
      padding: SIZES.space.lg,
      ...ELEVATION.floating,
    },
    brand: {
      backgroundColor: COLORS.surfaceBrand,
      borderRadius: SIZES.radius.card,
      padding: SIZES.space.xl,
      ...ELEVATION.brandGlow,
    },
    highlight: {
      backgroundColor: COLORS.accentTint,
      borderRadius: SIZES.radius.card,
      padding: SIZES.space.lg,
      borderWidth: 1,
      borderColor: COLORS.accentSubtle,
    },
    brandSoft: {
      backgroundColor: COLORS.brandTint,
      borderRadius: SIZES.radius.card,
      padding: SIZES.space.lg,
      borderWidth: 1,
      borderColor: COLORS.brandSubtle,
    },
  },

  /* --- Badges --- */
  badge: {
    brand: {
      backgroundColor: COLORS.brand,
      borderRadius: SIZES.radius.pill,
      paddingHorizontal: SIZES.space.md,
      paddingVertical: SIZES.space.xs,
      alignSelf: "flex-start",
    },
    accent: {
      backgroundColor: COLORS.accent,
      borderRadius: SIZES.radius.pill,
      paddingHorizontal: SIZES.space.md,
      paddingVertical: SIZES.space.xs,
      alignSelf: "flex-start",
    },
    neutral: {
      backgroundColor: COLORS.surfaceSunken,
      borderRadius: SIZES.radius.pill,
      paddingHorizontal: SIZES.space.md,
      paddingVertical: SIZES.space.xs,
      alignSelf: "flex-start",
    },
    success: {
      backgroundColor: COLORS.successSurface,
      borderRadius: SIZES.radius.pill,
      paddingHorizontal: SIZES.space.md,
      paddingVertical: SIZES.space.xs,
      alignSelf: "flex-start",
    },
    danger: {
      backgroundColor: COLORS.dangerSurface,
      borderRadius: SIZES.radius.pill,
      paddingHorizontal: SIZES.space.md,
      paddingVertical: SIZES.space.xs,
      alignSelf: "flex-start",
    },
  },

  /* --- Chips --- */
  chip: {
    base: {
      backgroundColor: COLORS.surfaceSunken,
      borderRadius: SIZES.radius.pill,
      paddingHorizontal: SIZES.space.lg,
      paddingVertical: SIZES.space.sm,
      flexDirection: "row",
      alignItems: "center",
    },
    selected: {
      backgroundColor: COLORS.brandSubtle,
      borderWidth: 1,
      borderColor: COLORS.borderBrand,
    },
    // Standalone brand-tinted chip (base + selected, pre-merged)
    brand: {
      backgroundColor: COLORS.brandSubtle,
      borderRadius: SIZES.radius.pill,
      paddingHorizontal: SIZES.space.lg,
      paddingVertical: SIZES.space.sm,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: COLORS.borderBrand,
    },
  },

  /* --- Media & icons --- */
  avatar: {
    sm: {
      width: SIZES.icon.xl,
      height: SIZES.icon.xl,
      borderRadius: SIZES.radius.pill,
      backgroundColor: COLORS.surfaceSunken,
      alignItems: "center",
      justifyContent: "center",
    },
    md: {
      width: SIZES.icon.avatar,
      height: SIZES.icon.avatar,
      borderRadius: SIZES.radius.pill,
      backgroundColor: COLORS.surfaceSunken,
      alignItems: "center",
      justifyContent: "center",
    },
    lg: {
      width: SIZES.icon.avatarLg,
      height: SIZES.icon.avatarLg,
      borderRadius: SIZES.radius.pill,
      backgroundColor: COLORS.surfaceSunken,
      alignItems: "center",
      justifyContent: "center",
    },
  },
  iconTile: {
    subtle: {
      width: SIZES.icon.avatar,
      height: SIZES.icon.avatar,
      borderRadius: SIZES.radius.md,
      backgroundColor: COLORS.brandTint,
      alignItems: "center",
      justifyContent: "center",
    },
    brand: {
      width: SIZES.icon.avatar,
      height: SIZES.icon.avatar,
      borderRadius: SIZES.radius.md,
      backgroundColor: COLORS.brand,
      alignItems: "center",
      justifyContent: "center",
    },
    accent: {
      width: SIZES.icon.avatar,
      height: SIZES.icon.avatar,
      borderRadius: SIZES.radius.md,
      backgroundColor: COLORS.accentTint,
      alignItems: "center",
      justifyContent: "center",
    },
  },

  /* --- Rows & layout --- */
  row: { flexDirection: "row", alignItems: "center" },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  center: { alignItems: "center", justifyContent: "center" },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SIZES.space.lg,
    paddingHorizontal: SIZES.space.gutter,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },

  divider: { height: 1, backgroundColor: COLORS.divider },
  dividerAccent: {
    height: 2,
    backgroundColor: COLORS.accentDeep,
    width: moderateScale(40),
  },

  /* --- Chrome --- */
  appBar: {
    base: {
      height: SIZES.appBarHeight,
      backgroundColor: COLORS.surface,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SIZES.space.gutter,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    brand: {
      height: SIZES.appBarHeight,
      backgroundColor: COLORS.brand,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SIZES.space.gutter,
    },
    transparent: {
      height: SIZES.appBarHeight,
      backgroundColor: COLORS.transparent,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SIZES.space.gutter,
    },
  },

  tabBar: {
    height: SIZES.tabBarHeight,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...ELEVATION.floating,
  },

  /* --- Modals & sheets --- */
  modal: {
    scrim: {
      flex: 1,
      backgroundColor: COLORS.scrim,
      justifyContent: "center",
      alignItems: "center",
      padding: SIZES.space.xl,
    },
    panel: {
      backgroundColor: COLORS.surface,
      borderRadius: SIZES.radius.xl,
      padding: SIZES.space.xxl,
      width: "90%",
      maxWidth: 420,
      ...ELEVATION.overlay,
    },
  },
  sheet: {
    panel: {
      backgroundColor: COLORS.surface,
      borderTopLeftRadius: SIZES.radius.xxl,
      borderTopRightRadius: SIZES.radius.xxl,
      paddingTop: SIZES.space.sm,
      paddingHorizontal: SIZES.space.gutter,
      paddingBottom: SIZES.space.xxxl,
      ...ELEVATION.overlay,
    },
    grabber: {
      width: moderateScale(40),
      height: moderateScale(4),
      backgroundColor: COLORS.borderStrong,
      borderRadius: SIZES.radius.pill,
      alignSelf: "center",
      marginBottom: SIZES.space.lg,
    },
  },

  /* --- Feedback --- */
  toast: {
    base: {
      backgroundColor: COLORS.surfaceInverse,
      borderRadius: SIZES.radius.md,
      padding: SIZES.space.lg,
      flexDirection: "row",
      alignItems: "center",
      ...ELEVATION.floating,
    },
    success: { backgroundColor: COLORS.success },
    danger: { backgroundColor: COLORS.danger },
    warning: { backgroundColor: COLORS.warning },
    info: { backgroundColor: COLORS.info },
  },

  /* --- Progress & controls --- */
  progress: {
    track: {
      height: moderateScale(8),
      backgroundColor: COLORS.surfaceSunken,
      borderRadius: SIZES.radius.pill,
      overflow: "hidden",
    },
    bar: {
      height: "100%",
      backgroundColor: COLORS.brand,
      borderRadius: SIZES.radius.pill,
    },
    barAccent: {
      height: "100%",
      backgroundColor: COLORS.accent,
      borderRadius: SIZES.radius.pill,
    },
  },

  toggle: {
    track: {
      width: moderateScale(50),
      height: moderateScale(28),
      borderRadius: SIZES.radius.pill,
      backgroundColor: COLORS.borderStrong,
      justifyContent: "center",
      padding: moderateScale(2),
    },
    trackOn: { backgroundColor: COLORS.brand },
    knob: {
      width: moderateScale(24),
      height: moderateScale(24),
      borderRadius: SIZES.radius.pill,
      backgroundColor: COLORS.surface,
      ...ELEVATION.raised,
    },
  },

  checkbox: {
    base: {
      width: moderateScale(20),
      height: moderateScale(20),
      borderRadius: SIZES.radius.xs,
      borderWidth: 2,
      borderColor: COLORS.borderStrong,
      alignItems: "center",
      justifyContent: "center",
    },
    checked: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  },
  radio: {
    base: {
      width: moderateScale(20),
      height: moderateScale(20),
      borderRadius: SIZES.radius.pill,
      borderWidth: 2,
      borderColor: COLORS.borderStrong,
      alignItems: "center",
      justifyContent: "center",
    },
    checked: { borderColor: COLORS.brand },
    dot: {
      width: moderateScale(10),
      height: moderateScale(10),
      borderRadius: SIZES.radius.pill,
      backgroundColor: COLORS.brand,
    },
  },

  skeleton: {
    block: {
      backgroundColor: COLORS.surfaceSunken,
      borderRadius: SIZES.radius.sm,
    },
    circle: {
      backgroundColor: COLORS.surfaceSunken,
      borderRadius: SIZES.radius.pill,
    },
  },

  floatingAction: {
    base: {
      width: SIZES.control.heightLg,
      height: SIZES.control.heightLg,
      borderRadius: SIZES.radius.pill,
      backgroundColor: COLORS.brand,
      alignItems: "center",
      justifyContent: "center",
      position: "absolute",
      right: SIZES.space.gutter,
      bottom: SIZES.space.xxxl,
      ...ELEVATION.brandGlow,
    },
    accent: {
      width: SIZES.control.heightLg,
      height: SIZES.control.heightLg,
      borderRadius: SIZES.radius.pill,
      backgroundColor: COLORS.accent,
      alignItems: "center",
      justifyContent: "center",
      position: "absolute",
      right: SIZES.space.gutter,
      bottom: SIZES.space.xxxl,
      ...ELEVATION.accentGlow,
    },
  },
};

/* ============================================================
   BREAKPOINTS
   ============================================================ */
export const BREAKPOINTS = {
  isCompact: width < 375,
  isRegular: width >= 375 && width < 768,
  isTablet: width >= 768,
};

/* ============================================================
   DEFAULT EXPORT
   ============================================================ */
const theme = {
  COLORS,
  SIZES,
  FONTS,
  ELEVATION,
  STYLES,
  BREAKPOINTS,
  scale,
  verticalScale,
  moderateScale,
  fontScale,
};

export default theme;

export { scale, verticalScale, moderateScale, fontScale, PALETTE };
