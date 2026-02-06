import { z } from 'zod';
import {
  AccountType,
  OwnerScope,
  TransactionStatus,
  NotificationType,
  GoalStatus,
} from './types';

// Enums
export const AccountTypeSchema = z.nativeEnum(AccountType);
export const OwnerScopeSchema = z.nativeEnum(OwnerScope);
export const TransactionStatusSchema = z.nativeEnum(TransactionStatus);
export const NotificationTypeSchema = z.nativeEnum(NotificationType);
export const GoalStatusSchema = z.nativeEnum(GoalStatus);

// Account schemas
export const CreateAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: AccountTypeSchema,
  ownerScope: OwnerScopeSchema,
  currency: z.string().length(3).default('EUR'),
  bankName: z.string().max(100).optional(),
  ibanLast4: z.string().length(4).optional(),
});

export const UpdateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bankName: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

// Transaction schemas
export const CreateTransactionSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number(),
  date: z.string().datetime(),
  description: z.string().min(1).max(500),
  categoryId: z.string().uuid().optional(),
  merchantName: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateTransactionSchema = z.object({
  amount: z.number().optional(),
  date: z.string().datetime().optional(),
  description: z.string().min(1).max(500).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  merchantName: z.string().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  tags: z.array(z.string()).optional(),
});

// Budget schemas
export const CreateBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive(),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  warningThreshold: z.number().min(0).max(1).default(0.8),
  criticalThreshold: z.number().min(0).max(2).default(1.0),
});

export const UpdateBudgetSchema = z.object({
  amount: z.number().positive().optional(),
  periodStart: z.string().date().optional(),
  periodEnd: z.string().date().optional(),
  warningThreshold: z.number().min(0).max(1).optional(),
  criticalThreshold: z.number().min(0).max(2).optional(),
  isActive: z.boolean().optional(),
});

// Goal schemas
export const CreateGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  targetAmount: z.number().positive(),
  targetDate: z.string().date(),
  priority: z.number().int().min(1).max(10).default(1),
  linkedAccountId: z.string().uuid().optional(),
});

export const UpdateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  targetDate: z.string().date().optional(),
  priority: z.number().int().min(1).max(10).optional(),
  status: GoalStatusSchema.optional(),
});

// Import schemas
export const ImportStatementSchema = z.object({
  accountId: z.string().uuid(),
  fileType: z.enum(['CSV', 'EXCEL', 'JSON', 'PDF']),
  fileData: z.string(),
  fileName: z.string().min(1).max(255),
});

// Insights schemas
export const GenerateInsightsSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/),
});

// Notification preferences schemas
export const UpdateNotificationPreferencesSchema = z.object({
  budgetWarningsEnabled: z.boolean().optional(),
  budgetExceededEnabled: z.boolean().optional(),
  anomalyAlertsEnabled: z.boolean().optional(),
  insightsEnabled: z.boolean().optional(),
  warningThreshold: z.number().min(0).max(1).optional(),
  criticalThreshold: z.number().min(0).max(2).optional(),
  pushToken: z.string().nullable().optional(),
});

// Pagination schemas
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Query filters
export const TransactionFilterSchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  isManual: z.boolean().optional(),
  search: z.string().optional(),
});

export const BudgetFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  periodStart: z.string().date().optional(),
  periodEnd: z.string().date().optional(),
});

// Validation helper functions
export function validateAccountType(type: string): type is AccountType {
  return Object.values(AccountType).includes(type as AccountType);
}

export function validateOwnerScope(scope: string): scope is OwnerScope {
  return Object.values(OwnerScope).includes(scope as OwnerScope);
}

export function validateTransactionStatus(status: string): status is TransactionStatus {
  return Object.values(TransactionStatus).includes(status as TransactionStatus);
}

export function validateNotificationType(type: string): type is NotificationType {
  return Object.values(NotificationType).includes(type as NotificationType);
}

export function validateGoalStatus(status: string): status is GoalStatus {
  return Object.values(GoalStatus).includes(status as GoalStatus);
}

// Type exports for inference
export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof UpdateBudgetSchema>;
export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>;
export type ImportStatementInput = z.infer<typeof ImportStatementSchema>;
export type GenerateInsightsInput = z.infer<typeof GenerateInsightsSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type TransactionFilterInput = z.infer<typeof TransactionFilterSchema>;
export type BudgetFilterInput = z.infer<typeof BudgetFilterSchema>;
