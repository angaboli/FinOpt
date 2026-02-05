// Common types used across the app

// Enums
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

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  accountId: string;
  categoryId?: string;
  type: 'income' | 'expense' | 'transfer';
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  category?: Category;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'business' | 'cash' | 'investment' | 'loan' | 'other';
  balance: number;
  currency: string;
  userId: string;
  ownerScope: 'personal' | 'professional';
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  spent: number;
  periodStart: Date;
  periodEnd: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  userId: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter types
export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  accountId?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: Transaction['status'];
  search?: string;
}

export interface BudgetFilters {
  categoryId?: string;
  active?: boolean;
}
