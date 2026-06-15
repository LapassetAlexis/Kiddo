// Kiddo Design Tokens
export const Fonts = {
  pixel:     'VT323_400Regular',
  pixelBold: 'PressStart2P_400Regular',
} as const;

export const darkColors = {
  bgScreen:       '#18181e',
  bgCard:         '#26262e',
  bgCardDone:     '#1e2820',
  bgCardPending:  '#262412',
  bgHero:         '#25252d',
  bgStreak:       '#22222a',
  bgNav:          '#18181e',

  gold:           '#FFB800',
  goldDim:        'rgba(255,184,0,0.5)',
  orange:         '#FF7040',
  green:          '#4CAF50',
  greenDim:       '#66BB6A',
  red:            '#EF5350',

  textPrimary:    'rgba(255,255,255,0.88)',
  textDim:        'rgba(255,255,255,0.40)',
  textFaint:      'rgba(255,255,255,0.22)',
  border:         'rgba(255,255,255,0.14)',
  borderGold:     'rgba(255,184,0,0.30)',
} as const;

export const lightColors = {
  bgScreen:       '#F2F2F7',
  bgCard:         '#FFFFFF',
  bgCardDone:     '#EEF7EF',
  bgCardPending:  '#FFF9E6',
  bgHero:         '#EBEBF0',
  bgStreak:       '#E5E5EC',
  bgNav:          '#FFFFFF',

  gold:           '#FFB800',
  goldDim:        'rgba(255,184,0,0.5)',
  orange:         '#FF7040',
  green:          '#4CAF50',
  greenDim:       '#66BB6A',
  red:            '#EF5350',

  textPrimary:    'rgba(0,0,0,0.87)',
  textDim:        'rgba(0,0,0,0.45)',
  textFaint:      'rgba(0,0,0,0.25)',
  border:         'rgba(0,0,0,0.08)',
  borderGold:     'rgba(255,184,0,0.25)',
} as const;

export type ThemeColors = {
  bgScreen: string; bgCard: string; bgCardDone: string; bgCardPending: string;
  bgHero: string; bgStreak: string; bgNav: string;
  gold: string; goldDim: string; orange: string;
  green: string; greenDim: string; red: string;
  textPrimary: string; textDim: string; textFaint: string;
  border: string; borderGold: string;
};

// Keep Colors as a static dark export for backward compat during migration
export const Colors = darkColors;

export const Radii = {
  card:   8,
  hero:   10,
  pill:   99,
  sm:     4,
  md:     6,
} as const;

export const Typography = {
  // Points balance — hero size
  ptsValue:   { fontSize: 52, fontFamily: Fonts.pixelBold, letterSpacing: -1 },
  // Screen title
  title:      { fontSize: 18, fontFamily: Fonts.pixelBold },
  // Card title
  taskName:   { fontSize: 16, fontFamily: Fonts.pixel },
  // Label / section header
  label:      { fontSize: 13, fontFamily: Fonts.pixel, letterSpacing: 1.0, textTransform: 'uppercase' as const },
  // Body
  body:       { fontSize: 16, fontFamily: Fonts.pixel },
  // Caption
  caption:    { fontSize: 13, fontFamily: Fonts.pixel },
  // CTA button text
  cta:        { fontSize: 14, fontFamily: Fonts.pixelBold },
} as const;

// Pixel-art button shadow (bottom-right offset = depth effect)
export const PixelShadow = {
  gold:   { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: '#b37f00', borderRightColor: '#b37f00' },
  green:  { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: '#2e7d32', borderRightColor: '#2e7d32' },
  orange: { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: '#bf4020', borderRightColor: '#bf4020' },
  red:    { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: '#b71c1c', borderRightColor: '#b71c1c' },
  subtle: { borderBottomWidth: 3, borderRightWidth: 3, borderBottomColor: 'rgba(0,0,0,0.4)', borderRightColor: 'rgba(0,0,0,0.4)' },
} as const;

export const Spacing = {
  screen: 20,  // horizontal padding
  cardPad: 16, // card internal padding
  gap: 10,     // gap between cards
} as const;
