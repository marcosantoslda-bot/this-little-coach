/**
 * Único conjunto de tokens da app (ADR-0002: design monocromático).
 * Modo escuro é a inversão exata. Nenhuma cor transmite estado.
 */
import { useColorScheme } from 'react-native';

export interface Palette {
  bg: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  /** Botão primário: fundo */
  primary: string;
  /** Botão primário: texto */
  onPrimary: string;
  /** Fundo muito discreto (barras de progresso, campos) */
  muted: string;
}

export const lightPalette: Palette = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#6B6B6B',
  border: '#E5E5E5',
  primary: '#000000',
  onPrimary: '#FFFFFF',
  muted: '#F2F2F2',
};

export const darkPalette: Palette = {
  bg: '#000000',
  surface: '#000000',
  text: '#FFFFFF',
  textSecondary: '#8A8A8A',
  border: '#262626',
  primary: '#FFFFFF',
  onPrimary: '#000000',
  muted: '#141414',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { card: 12, button: 12, chip: 999 } as const;

/** Hierarquia por tamanho e peso, nunca por cor. */
export const fontSize = {
  display: 40,
  big: 34,
  title: 22,
  body: 17,
  small: 15,
  label: 13,
} as const;

export const hairline = 1;

export type ColorScheme = 'light' | 'dark';

export function useTheme(): Palette & { scheme: ColorScheme } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const palette = scheme === 'dark' ? darkPalette : lightPalette;
  return { ...palette, scheme };
}
