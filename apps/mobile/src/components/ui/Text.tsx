import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { fontSize, useTheme } from '@/theme';

export type TextVariant = 'display' | 'big' | 'title' | 'body' | 'bodyStrong' | 'secondary' | 'label' | 'caption';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  /** Cor invertida (para texto sobre o botão primário). */
  inverted?: boolean;
  align?: TextStyle['textAlign'];
}

const styles: Record<TextVariant, TextStyle> = {
  display: { fontSize: fontSize.display, fontWeight: '700', letterSpacing: -0.5, lineHeight: 46 },
  big: { fontSize: fontSize.big, fontWeight: '700', letterSpacing: -0.5, lineHeight: 40 },
  title: { fontSize: fontSize.title, fontWeight: '600', lineHeight: 28 },
  body: { fontSize: fontSize.body, fontWeight: '400', lineHeight: 24 },
  bodyStrong: { fontSize: fontSize.body, fontWeight: '600', lineHeight: 24 },
  secondary: { fontSize: fontSize.small, fontWeight: '400', lineHeight: 21 },
  label: { fontSize: fontSize.label, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', lineHeight: 18 },
  caption: { fontSize: fontSize.label, fontWeight: '400', lineHeight: 18 },
};

const secondaryVariants: TextVariant[] = ['secondary', 'label', 'caption'];

export function Text({ variant = 'body', inverted, align, style, ...rest }: TextProps) {
  const t = useTheme();
  const isSecondary = secondaryVariants.includes(variant);
  const color = inverted ? t.onPrimary : isSecondary ? t.textSecondary : t.text;
  return <RNText {...rest} style={[styles[variant], { color }, align ? { textAlign: align } : null, style]} />;
}
