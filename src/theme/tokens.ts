import type { AppTheme } from '../types';

export const themes = {
  light: {
    background: '#F3F4EF', surface: '#FFFFFF', surfaceMuted: '#E8EBE4', text: '#1C2A26',
    muted: '#718078', border: '#DDE2DA', primary: '#184C43', accent: '#D5F36A', danger: '#C74B3A',
    success: '#2F7555', tab: '#FFFFFF', shadow: '#183A32',
  },
  dark: {
    background: '#101916', surface: '#1B2521', surfaceMuted: '#25322C', text: '#F0F3EC',
    muted: '#9BAAA1', border: '#33443B', primary: '#B9DE5B', accent: '#D5F36A', danger: '#F28A78',
    success: '#92C8A1', tab: '#1B2521', shadow: '#000000',
  },
} as const;

export type ThemeColors = (typeof themes)[AppTheme];