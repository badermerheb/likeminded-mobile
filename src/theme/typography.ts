import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({ ios: 'System', android: 'Roboto', default: 'System' });

export const typography = {
  largeTitle: { fontFamily, fontSize: 34, fontWeight: '700', lineHeight: 41, letterSpacing: 0.37 } as TextStyle,
  title1: { fontFamily, fontSize: 28, fontWeight: '700', lineHeight: 34, letterSpacing: 0.36 } as TextStyle,
  title2: { fontFamily, fontSize: 22, fontWeight: '700', lineHeight: 28, letterSpacing: 0.35 } as TextStyle,
  title3: { fontFamily, fontSize: 20, fontWeight: '600', lineHeight: 25, letterSpacing: 0.38 } as TextStyle,
  headline: { fontFamily, fontSize: 17, fontWeight: '600', lineHeight: 22, letterSpacing: -0.41 } as TextStyle,
  body: { fontFamily, fontSize: 17, fontWeight: '400', lineHeight: 22, letterSpacing: -0.41 } as TextStyle,
  callout: { fontFamily, fontSize: 16, fontWeight: '400', lineHeight: 21, letterSpacing: -0.32 } as TextStyle,
  subhead: { fontFamily, fontSize: 15, fontWeight: '400', lineHeight: 20, letterSpacing: -0.24 } as TextStyle,
  footnote: { fontFamily, fontSize: 13, fontWeight: '400', lineHeight: 18, letterSpacing: -0.08 } as TextStyle,
  caption1: { fontFamily, fontSize: 12, fontWeight: '400', lineHeight: 16, letterSpacing: 0 } as TextStyle,
  caption2: { fontFamily, fontSize: 11, fontWeight: '400', lineHeight: 13, letterSpacing: 0.07 } as TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
