export const colors = {
  // Backgrounds
  white: '#FFFFFF',
  bgSecondary: '#F2F2F7',

  // Accent
  accent: '#FF3B30',
  accentAmber: '#FF9500',

  // Text
  textPrimary: '#000000',
  textSecondary: '#8E8E93',
  textTertiary: '#C6C6C8',

  // Borders
  border: '#C6C6C8',

  // Tile / card backgrounds
  tile: '#F2F2F7',
  card: '#FFFFFF',

  // Tab bar
  tabInactive: '#8E8E93',
};

export const typography = {
  // Hero numbers — level scores, big stats
  hero: {
    fontSize: 88,
    fontWeight: '700' as const,
    letterSpacing: -1.5,
    color: colors.textPrimary,
  },
  heroMd: {
    fontSize: 52,
    fontWeight: '700' as const,
    letterSpacing: -1,
    color: colors.accent,
  },
  heroSm: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },

  // Labels — small uppercase metadata
  label: {
    fontSize: 11,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },

  // Body
  bodyLg: { fontSize: 17, fontWeight: '400' as const },
  bodyMd: { fontSize: 15, fontWeight: '400' as const },
  bodySm: { fontSize: 13, fontWeight: '400' as const },

  // Headings
  headingLg: { fontSize: 22, fontWeight: '600' as const },
  headingMd: { fontSize: 17, fontWeight: '600' as const },
  headingSm: { fontSize: 14, fontWeight: '600' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 100,
  full: 9999,
};

export const borders = {
  hairline: 0.5,
  color: colors.border,
};
