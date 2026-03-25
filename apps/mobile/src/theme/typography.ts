import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, fontFamily },
  h2: { fontSize: 22, fontWeight: '600' as const, fontFamily },
  h3: { fontSize: 18, fontWeight: '600' as const, fontFamily },
  body: { fontSize: 16, fontWeight: '400' as const, fontFamily },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, fontFamily },
  caption: { fontSize: 12, fontWeight: '400' as const, fontFamily },
  label: { fontSize: 14, fontWeight: '500' as const, fontFamily },
  button: { fontSize: 16, fontWeight: '600' as const, fontFamily },
} as const;
