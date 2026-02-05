export const colors = {
  // Primary
  primary: {
    main: '#14B8A6',
    dark: '#0D9488',
    light: '#5EEAD4',
  },

  // Status
  status: {
    success: '#10B981',
    successLight: '#D1FAE5',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
  },

  // Neutral scale
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic
  background: '#F9FAFB',
  card: '#FFFFFF',
  border: '#E5E7EB',

  // Text (deprecated - use neutral for consistency)
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export type Colors = typeof colors;
