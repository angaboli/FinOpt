
export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT_CARD = 'CREDIT_CARD',
  BUSINESS = 'BUSINESS',
  CASH = 'CASH',
  INVESTMENT = 'INVESTMENT',
  LOAN = 'LOAN',
  OTHER = 'OTHER',
}

export enum OwnerScope {
  PERSONAL = 'PERSONAL',
  PROFESSIONAL = 'PROFESSIONAL',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationType {
  BUDGET_WARNING = 'BUDGET_WARNING',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  ANOMALY_DETECTED = 'ANOMALY_DETECTED',
  GOAL_MILESTONE = 'GOAL_MILESTONE',
  INSIGHT_READY = 'INSIGHT_READY',
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  ownerScope: OwnerScope;
  currency: string;
  balance: number;
  bankName?: string;
  ibanLast4?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId?: string;
  name: string;
  icon?: string;
  color?: string;
  isSystem: boolean;
  parentCategoryId?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  categoryId?: string;
  merchantName?: string;
  isRecurring: boolean;
  isManual: boolean;
  status: TransactionStatus;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  warningThreshold: number;
  criticalThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetConsumption {
  budgetId: string;
  budgetAmount: number;
  spent: number;
  percentage: number;
}

export interface BudgetEvent {
  id: string;
  budgetId: string;
  userId: string;
  eventType: string;
  thresholdPercentage: number;
  currentSpent: number;
  budgetAmount: number;
  triggeredAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  sentAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  budgetWarningsEnabled: boolean;
  budgetExceededEnabled: boolean;
  anomalyAlertsEnabled: boolean;
  insightsEnabled: boolean;
  warningThreshold: number;
  criticalThreshold: number;
  pushToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: number;
  linkedAccountId?: string;
  status: GoalStatus;
  plan?: GoalPlan;
  createdAt: string;
  updatedAt: string;
}

export interface GoalPlan {
  monthlySavingTarget: number;
  budgetCaps: Array<{
    categoryId: string;
    maxAmount: number;
    reason: string;
  }>;
  arbitrationRules: string[];
  generatedAt: string;
}

export interface ImportHistory {
  id: string;
  userId: string;
  accountId: string;
  fileName: string;
  fileType: string;
  transactionsImported: number;
  status: string;
  errorMessage?: string;
  importedAt: string;
}

// AI Insights types
export interface SavingsOpportunity {
  title: string;
  estimatedMonthlySaving: number;
  confidence: number;
  evidence: string[];
}

export interface SavingStrategy {
  strategy: string;
  amount: number;
  why: string;
  confidence: number;
}

export interface RecommendedSavingsSplit {
  emergencyFund: number;
  goalSavings: number;
  investment: number;
}

export interface Subscription {
  merchant: string;
  amount: number;
  period: string;
  confidence: number;
  lastSeen?: string;
}

export interface Anomaly {
  title: string;
  description: string;
  amount: number;
  date: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
}

export interface BudgetAdjustment {
  category: string;
  categoryId?: string;
  action: 'increase' | 'decrease';
  amount: number;
  reason: string;
}

export interface SpendingTrigger {
  pattern: string;
  description: string;
  frequency: number;
  totalAmount: number;
  advice: string;
}

export interface AIInsight {
  month: string;
  currency: string;
  incomeEstimate: number;
  fixedCostsEstimate: number;
  savingsOpportunities: SavingsOpportunity[];
  savingStrategies: SavingStrategy[];
  recommendedSavingsSplit?: RecommendedSavingsSplit;
  subscriptions: Subscription[];
  anomalies: Anomaly[];
  budgetAdjustments: BudgetAdjustment[];
  avoidSpendingTriggers: SpendingTrigger[];
  nextActions: string[];
  generatedAt: string;
}

export interface InsightRecord {
  id: string;
  userId: string;
  monthYear: string;
  data: AIInsight;
  incomeEstimate?: number;
  fixedCostsEstimate?: number;
  generatedAt: string;
}

// API Request/Response types
export interface CreateAccountRequest {
  name: string;
  type: AccountType;
  ownerScope: OwnerScope;
  currency: string;
  bankName?: string;
  ibanLast4?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  bankName?: string;
  isActive?: boolean;
}

export interface CreateTransactionRequest {
  accountId: string;
  amount: number;
  date: string;
  description: string;
  categoryId?: string;
  merchantName?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateTransactionRequest {
  amount?: number;
  date?: string;
  description?: string;
  categoryId?: string;
  merchantName?: string;
  notes?: string;
  tags?: string[];
}

export interface CreateBudgetRequest {
  categoryId: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export interface UpdateBudgetRequest {
  amount?: number;
  periodStart?: string;
  periodEnd?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  isActive?: boolean;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  targetAmount: number;
  targetDate: string;
  priority?: number;
  linkedAccountId?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  priority?: number;
  status?: GoalStatus;
}

export interface ImportStatementRequest {
  accountId: string;
  fileType: 'CSV' | 'OFX' | 'PDF';
  fileData: string; // base64
  fileName: string;
}

export interface GenerateInsightsRequest {
  monthYear: string; // YYYY-MM
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}
