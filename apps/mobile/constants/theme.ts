// Kiddo Design Tokens

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
  border:         'rgba(255,255,255,0.07)',
  borderGold:     'rgba(255,184,0,0.20)',
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
  card:   18,
  hero:   28,
  pill:   99,
  sm:     10,
  md:     14,
} as const;

export const Typography = {
  // Points balance — hero size
  ptsValue:   { fontSize: 68, fontWeight: '900' as const, letterSpacing: -3 },
  // Screen title
  title:      { fontSize: 22, fontWeight: '900' as const },
  // Card title
  taskName:   { fontSize: 15, fontWeight: '800' as const },
  // Label / section header
  label:      { fontSize: 11, fontWeight: '900' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const },
  // Body
  body:       { fontSize: 14, fontWeight: '600' as const },
  // Caption
  caption:    { fontSize: 11, fontWeight: '600' as const },
} as const;

export const Spacing = {
  screen: 20,  // horizontal padding
  cardPad: 16, // card internal padding
  gap: 10,     // gap between cards
} as const;
