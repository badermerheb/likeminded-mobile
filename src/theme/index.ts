export {colors, darkColors, lightColors} from './colors';
export type {ThemeColors} from './colors';
export {ThemeProvider, useTheme} from './ThemeContext';
export { typography } from './typography';
export type { TypographyVariant } from './typography';
export { spacing, borderRadius, hitSlop, MIN_TOUCH_TARGET } from './spacing';

// Dark-mode shadows — subtle depth + colored glow accents
export const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 5 },
  xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 8 },
  soft: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 2 },
  // Colored glow shadows for premium feel
  glowPrimary: { shadowColor: '#5564FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 6 },
  glowSecondary: { shadowColor: '#FF3FE5', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 },
  glowAccent: { shadowColor: '#FF7D2A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
} as const;
