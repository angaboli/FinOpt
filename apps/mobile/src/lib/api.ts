/**
 * API Client for Finopt
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import Constants from 'expo-constants';
import type {
  Account,
  Transaction,
  Budget,
  Goal,
  PaginatedResponse,
} from '@finopt/shared';

// Define request types inline
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  sentAt?: string;
  createdAt: string;
}

interface InsightRecord {
  id: string;
  userId: string;
  monthYear: string;
  data: any;
  incomeEstimate?: number;
  fixedCostsEstimate?: number;
  generatedAt: string;
}

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000/api/v1';

if (__DEV__) {
  console.log('API Configuration:', { url: API_URL });
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000, // 30 seconds pour les opérations qui peuvent prendre du temps
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  // Authentication
  async signIn(email: string, password: string) {
    const response = await this.client.post('/auth/signin', { email, password });
    return response.data;
  }

  async signUp(email: string, password: string, fullName: string) {
    const response = await this.client.post('/auth/signup', {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  }

  async signOut() {
    await this.client.post('/auth/signout');
    this.clearToken();
  }

  // Categories
  async getCategories(): Promise<{ id: string; name: string; icon: string | null; color: string | null; is_system: boolean }[]> {
    const response = await this.client.get('/categories/');
    return response.data;
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    const response = await this.client.get('/accounts/');
    return response.data;
  }

  async getAccount(accountId: string): Promise<Account> {
    const response = await this.client.get(`/accounts/${accountId}`);
    return response.data;
  }

  async createAccount(data: any): Promise<Account> {
    const response = await this.client.post('/accounts/', data);
    return response.data;
  }

  async updateAccount(accountId: string, data: any): Promise<Account> {
    const response = await this.client.put(`/accounts/${accountId}`, data);
    return response.data;
  }

  async deleteAccount(accountId: string): Promise<void> {
    await this.client.delete(`/accounts/${accountId}`);
  }

  // Transactions
  async getTransactions(params?: {
    accountId?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Transaction>> {
    const response = await this.client.get('/transactions/', { params });
    return response.data;
  }

  async getTransaction(transactionId: string): Promise<Transaction> {
    const response = await this.client.get(`/transactions/${transactionId}`);
    return response.data;
  }

  async createTransaction(data: any): Promise<Transaction> {
    const response = await this.client.post('/transactions/', data);
    return response.data;
  }

  async updateTransaction(
    transactionId: string,
    data: any
  ): Promise<Transaction> {
    const response = await this.client.put(`/transactions/${transactionId}`, data);
    return response.data;
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    await this.client.delete(`/transactions/${transactionId}`);
  }

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    const response = await this.client.get('/budgets/');
    return response.data;
  }

  async getBudget(budgetId: string): Promise<Budget> {
    const response = await this.client.get(`/budgets/${budgetId}`);
    return response.data;
  }

  async getBudgetConsumption(budgetId: string) {
    const response = await this.client.get(`/budgets/${budgetId}/consumption`);
    return response.data;
  }

  async createBudget(data: any): Promise<Budget> {
    const response = await this.client.post('/budgets/', data);
    return response.data;
  }

  async updateBudget(budgetId: string, data: any): Promise<Budget> {
    const response = await this.client.put(`/budgets/${budgetId}`, data);
    return response.data;
  }

  async deleteBudget(budgetId: string): Promise<void> {
    await this.client.delete(`/budgets/${budgetId}`);
  }

  // Insights
  async getInsights(monthYear: string): Promise<InsightRecord> {
    const response = await this.client.get(`/insights/${monthYear}`);
    return response.data;
  }

  async generateInsights(monthYear: string): Promise<InsightRecord> {
    const response = await this.client.post('/insights/generate', { month_year: monthYear });
    return response.data;
  }

  async listInsights(): Promise<InsightRecord[]> {
    const response = await this.client.get('/insights/');
    return response.data;
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const response = await this.client.get('/notifications/');
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.client.put(`/notifications/${notificationId}/read`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.client.put('/notifications/read-all');
  }

  async getNotificationPreferences() {
    const response = await this.client.get('/notifications/preferences');
    return response.data;
  }

  async updateNotificationPreferences(data: any) {
    const response = await this.client.put('/notifications/preferences', data);
    return response.data;
  }

  // Goals
  async getGoals(): Promise<Goal[]> {
    const response = await this.client.get('/goals/');
    return response.data;
  }

  async getGoal(goalId: string): Promise<Goal> {
    const response = await this.client.get(`/goals/${goalId}`);
    return response.data;
  }

  async createGoal(data: any): Promise<Goal> {
    const response = await this.client.post('/goals/', data);
    return response.data;
  }

  async updateGoal(goalId: string, data: any): Promise<Goal> {
    const response = await this.client.put(`/goals/${goalId}`, data);
    return response.data;
  }

  async deleteGoal(goalId: string): Promise<void> {
    await this.client.delete(`/goals/${goalId}`);
  }

  async generateGoalPlan(goalId: string) {
    const response = await this.client.post(`/goals/${goalId}/generate-plan`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
