export const APP_NAME = 'Finopt';
export const APP_VERSION = '1.0.0';

// API Configuration
export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Budget defaults
export const DEFAULT_WARNING_THRESHOLD = 0.8; // 80%
export const DEFAULT_CRITICAL_THRESHOLD = 1.0; // 100%

// Currency
export const DEFAULT_CURRENCY = 'EUR';
export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;

// Date formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const MONTH_YEAR_FORMAT = 'YYYY-MM';

// Transaction limits
export const MAX_TRANSACTION_DESCRIPTION_LENGTH = 500;
export const MAX_TRANSACTION_NOTE_LENGTH = 1000;

// Category icons and colors
export const DEFAULT_CATEGORY_ICONS = {
  SALARY: '💰',
  FOOD: '🍔',
  TRANSPORT: '🚗',
  HOUSING: '🏠',
  SHOPPING: '🛍️',
  ENTERTAINMENT: '🎮',
  HEALTH: '⚕️',
  SUBSCRIPTIONS: '📱',
  SAVINGS: '🏦',
  OTHER: '📌',
} as const;

export const DEFAULT_CATEGORY_COLORS = {
  SALARY: '#10b981',
  FOOD: '#f59e0b',
  TRANSPORT: '#3b82f6',
  HOUSING: '#8b5cf6',
  SHOPPING: '#ec4899',
  ENTERTAINMENT: '#06b6d4',
  HEALTH: '#ef4444',
  SUBSCRIPTIONS: '#6366f1',
  SAVINGS: '#14b8a6',
  OTHER: '#6b7280',
} as const;

// Import file types
export const SUPPORTED_IMPORT_FORMATS = ['CSV', 'OFX', 'PDF'] as const;
export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Notification settings
export const NOTIFICATION_RETENTION_DAYS = 30;

// AI Insight settings
export const MIN_TRANSACTIONS_FOR_INSIGHTS = 5;
export const INSIGHTS_LOOKBACK_MONTHS = 3;

// Goal settings
export const MIN_GOAL_AMOUNT = 100;
export const MAX_GOAL_AMOUNT = 1000000;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Worker queue names
export const QUEUE_NAMES = {
  IMPORT: 'import',
  INSIGHTS: 'insights',
  NOTIFICATIONS: 'notifications',
  BUDGETS: 'budgets',
} as const;

// Notification titles
export const NOTIFICATION_TITLES = {
  BUDGET_WARNING: (categoryName: string) => `Budget ${categoryName} : Attention`,
  BUDGET_EXCEEDED: (categoryName: string) => `Budget ${categoryName} dépassé`,
  ANOMALY_DETECTED: 'Anomalie détectée',
  GOAL_MILESTONE: (goalTitle: string) => `Objectif ${goalTitle} : Étape atteinte`,
  INSIGHT_READY: 'Vos insights sont prêts',
} as const;

// Account type labels
export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Compte courant',
  SAVINGS: 'Compte épargne',
  CREDIT_CARD: 'Carte de crédit',
  BUSINESS: 'Compte professionnel',
  CASH: 'Espèces',
  INVESTMENT: 'Investissement',
  LOAN: 'Prêt',
  OTHER: 'Autre',
};

// Owner scope labels
export const OWNER_SCOPE_LABELS: Record<string, string> = {
  PERSONAL: 'Personnel',
  PROFESSIONAL: 'Professionnel',
};

// Transaction status labels
export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  COMPLETED: 'Complétée',
  CANCELLED: 'Annulée',
};

// Goal status labels
export const GOAL_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  PAUSED: 'En pause',
  COMPLETED: 'Complété',
  CANCELLED: 'Annulé',
};

// Regex patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  MONTH_YEAR: /^\d{4}-\d{2}$/,
  CURRENCY: /^[A-Z]{3}$/,
} as const;
