// LikeMinded Design System — Dark & Light Modes
// Color Theory: Split-complementary (Indigo <-> Magenta + Orange)
// 60-30-10 Rule: 60% surfaces, 30% glass/card, 10% gradient accents

export const darkColors = {
  // -- Brand Primaries --
  primary: '#5564FF',
  primaryDark: '#3D4ADB',
  primaryLight: '#7A86FF',
  primaryMuted: 'rgba(85, 100, 255, 0.15)',
  secondary: '#FF3FE5',
  secondaryDark: '#D635BF',
  secondaryLight: '#FF6EEC',
  secondaryMuted: 'rgba(255, 63, 229, 0.15)',
  accent: '#FF7D2A',
  accentMuted: 'rgba(255, 125, 42, 0.15)',

  // -- Gradients --
  gradient: {start: '#5564FF', end: '#FF3FE5'} as {start: string; end: string},
  gradientWarm: {start: '#FF3FE5', end: '#FF7D2A'} as {start: string; end: string},
  gradientSubtle: {start: '#0D0B2E', end: '#1A1145'} as {start: string; end: string},
  gradientCard: {
    start: 'rgba(255,255,255,0.08)',
    end: 'rgba(255,255,255,0.02)',
  } as {start: string; end: string},

  // -- Deep Brand --
  deepPurple: '#54006A',
  deepNavy: '#07002A',

  // -- Surfaces --
  background: '#07002A',
  backgroundElevated: '#0D0B2E',
  surface: 'rgba(255, 255, 255, 0.06)',
  surfaceHover: 'rgba(255, 255, 255, 0.10)',
  surfaceSecondary: 'rgba(255, 255, 255, 0.04)',
  surfaceTertiary: 'rgba(255, 255, 255, 0.03)',
  surfaceSolid: '#0F0D35',
  surfaceInput: 'rgba(255, 255, 255, 0.08)',

  // -- Text --
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textTertiary: 'rgba(255,255,255,0.45)',
  textInverse: '#07002A',
  textLink: '#7A86FF',
  textOnGradient: '#FFFFFF',

  // -- Semantic --
  success: '#34D399',
  successLight: 'rgba(52, 211, 153, 0.15)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.15)',
  error: '#FB7185',
  errorLight: 'rgba(251, 113, 133, 0.15)',
  info: '#60A5FA',
  infoLight: 'rgba(96, 165, 250, 0.15)',

  // -- Borders & Separators --
  separator: 'rgba(255, 255, 255, 0.12)',
  separatorLight: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.10)',
  borderFocus: '#5564FF',
  borderGlass: 'rgba(255, 255, 255, 0.08)',

  // -- Chat --
  chatMe: '#5564FF',
  chatMeText: '#FFFFFF',
  chatThem: 'rgba(255, 255, 255, 0.08)',
  chatThemText: '#FFFFFF',
  chatSystem: 'rgba(255, 255, 255, 0.04)',
  chatSystemText: 'rgba(255, 255, 255, 0.5)',

  // -- UI States --
  overlay: 'rgba(7, 0, 42, 0.75)',
  skeleton: 'rgba(255, 255, 255, 0.06)',
  skeletonHighlight: 'rgba(255, 255, 255, 0.12)',
  disabled: 'rgba(255, 255, 255, 0.15)',
  disabledText: 'rgba(255, 255, 255, 0.3)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // -- Tab Bar --
  tabActive: '#5564FF',
  tabInactive: 'rgba(255, 255, 255, 0.4)',
  tabBarBg: 'rgba(7, 0, 42, 0.95)',

  // -- Fill colors --
  fill: 'rgba(255, 255, 255, 0.08)',
  fillSecondary: 'rgba(255, 255, 255, 0.06)',
  fillTertiary: 'rgba(255, 255, 255, 0.04)',

  // -- Glow effects --
  glowPrimary: 'rgba(85, 100, 255, 0.3)',
  glowSecondary: 'rgba(255, 63, 229, 0.25)',
  glowAccent: 'rgba(255, 125, 42, 0.2)',
};

export const lightColors: typeof darkColors = {
  // -- Brand Primaries --
  primary: '#4A56E8',
  primaryDark: '#3D4ADB',
  primaryLight: '#6B78FF',
  primaryMuted: 'rgba(74, 86, 232, 0.10)',
  secondary: '#E835CC',
  secondaryDark: '#C82DB3',
  secondaryLight: '#FF6EEC',
  secondaryMuted: 'rgba(232, 53, 204, 0.10)',
  accent: '#F06B1A',
  accentMuted: 'rgba(240, 107, 26, 0.10)',

  // -- Gradients --
  gradient: {start: '#4A56E8', end: '#E835CC'},
  gradientWarm: {start: '#E835CC', end: '#F06B1A'},
  gradientSubtle: {start: '#F5F3FF', end: '#FDF2F8'},
  gradientCard: {
    start: 'rgba(0,0,0,0.03)',
    end: 'rgba(0,0,0,0.01)',
  },

  // -- Deep Brand --
  deepPurple: '#7C3AED',
  deepNavy: '#1E1B4B',

  // -- Surfaces --
  background: '#F8F7FC',
  backgroundElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceHover: 'rgba(0, 0, 0, 0.04)',
  surfaceSecondary: '#F3F2F8',
  surfaceTertiary: '#EEEDF5',
  surfaceSolid: '#FFFFFF',
  surfaceInput: '#F3F2F8',

  // -- Text --
  textPrimary: '#1A1A2E',
  textSecondary: 'rgba(26, 26, 46, 0.65)',
  textTertiary: 'rgba(26, 26, 46, 0.4)',
  textInverse: '#FFFFFF',
  textLink: '#4A56E8',
  textOnGradient: '#FFFFFF',

  // -- Semantic --
  success: '#059669',
  successLight: 'rgba(5, 150, 105, 0.10)',
  warning: '#D97706',
  warningLight: 'rgba(217, 119, 6, 0.10)',
  error: '#E11D48',
  errorLight: 'rgba(225, 29, 72, 0.08)',
  info: '#2563EB',
  infoLight: 'rgba(37, 99, 235, 0.08)',

  // -- Borders & Separators --
  separator: 'rgba(0, 0, 0, 0.10)',
  separatorLight: 'rgba(0, 0, 0, 0.05)',
  border: 'rgba(0, 0, 0, 0.10)',
  borderFocus: '#4A56E8',
  borderGlass: 'rgba(0, 0, 0, 0.08)',

  // -- Chat --
  chatMe: '#4A56E8',
  chatMeText: '#FFFFFF',
  chatThem: '#EEEDF5',
  chatThemText: '#1A1A2E',
  chatSystem: '#F3F2F8',
  chatSystemText: 'rgba(26, 26, 46, 0.5)',

  // -- UI States --
  overlay: 'rgba(0, 0, 0, 0.4)',
  skeleton: 'rgba(0, 0, 0, 0.06)',
  skeletonHighlight: 'rgba(0, 0, 0, 0.10)',
  disabled: 'rgba(0, 0, 0, 0.08)',
  disabledText: 'rgba(0, 0, 0, 0.25)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // -- Tab Bar --
  tabActive: '#4A56E8',
  tabInactive: 'rgba(26, 26, 46, 0.35)',
  tabBarBg: 'rgba(248, 247, 252, 0.95)',

  // -- Fill colors --
  fill: 'rgba(0, 0, 0, 0.05)',
  fillSecondary: 'rgba(0, 0, 0, 0.04)',
  fillTertiary: 'rgba(0, 0, 0, 0.03)',

  // -- Glow effects --
  glowPrimary: 'rgba(74, 86, 232, 0.15)',
  glowSecondary: 'rgba(232, 53, 204, 0.12)',
  glowAccent: 'rgba(240, 107, 26, 0.10)',
};

export type ThemeColors = typeof darkColors;

// ── Reactive colors proxy ──
// `colors` is a Proxy that delegates every property read to whichever palette
// is currently active.  When the ThemeProvider calls `_setActiveColors(light)`,
// every subsequent `colors.xxx` read — including inside already-created
// StyleSheets — will return the light-mode value, because StyleSheet stores
// the *reference* and the Proxy resolves lazily.
let _active: ThemeColors = darkColors;

export function _setActiveColors(c: ThemeColors) {
  _active = c;
}

// Build a proxy whose top-level keys forward to _active.
// For nested objects (gradient, gradientWarm, …) we return a nested proxy.
const handler: ProxyHandler<ThemeColors> = {
  get(_target, prop: string) {
    const val = (_active as any)[prop];
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      // Return a proxy for nested objects like gradient: {start, end}
      return new Proxy(val, {
        get(_t, innerProp: string) {
          return ((_active as any)[prop] as any)[innerProp];
        },
      });
    }
    return val;
  },
};

export const colors = new Proxy(darkColors, handler) as ThemeColors;
