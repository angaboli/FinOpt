export const typography = {
  heading: {
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
  },

  body: {
    large: {
      fontSize: 18,
      fontWeight: '400' as const,
      lineHeight: 28,
    },
    regular: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    small: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    tiny: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
  },

  // Special
  amount: {
    large: {
      fontSize: 36,
      fontWeight: '700' as const,
      lineHeight: 44,
    },
    regular: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
    },
    small: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
  },
} as const;

export type Typography = typeof typography;
