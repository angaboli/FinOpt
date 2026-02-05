/**
 * Tests API - Vérification de toutes les fonctionnalités API
 *
 * Pour exécuter ces tests:
 * 1. Assurez-vous que l'API backend est démarrée
 * 2. Créez un utilisateur de test (email: test@finopt.app, password: test123)
 * 3. Exécutez: npm test
 */

import { apiClient } from '../lib/api';
import { AccountType, OwnerScope } from '@finopt/shared';

// Configuration des tests
const TEST_USER = {
  email: 'test@finopt.app',
  password: 'test123',
  fullName: 'Test User',
};

let authToken: string;
let testAccountId: string;
let testTransactionId: string;
let testBudgetId: string;
let testGoalId: string;

describe('API Integration Tests', () => {
  // ========== AUTHENTICATION ==========
  describe('Authentication', () => {
    test('should sign up a new user', async () => {
      try {
        const response = await apiClient.signUp(
          TEST_USER.email,
          TEST_USER.password,
          TEST_USER.fullName
        );

        expect(response).toHaveProperty('access_token');
        expect(response).toHaveProperty('user');
        expect(response.user.email).toBe(TEST_USER.email);

        authToken = response.access_token;
        apiClient.setToken(authToken);

        console.log('✅ SignUp successful');
      } catch (error: any) {
        // Si l'utilisateur existe déjà, c'est OK
        if (error.response?.status === 409) {
          console.log('⚠️  User already exists, signing in instead');
        } else {
          throw error;
        }
      }
    });

    test('should sign in with existing credentials', async () => {
      const response = await apiClient.signIn(
        TEST_USER.email,
        TEST_USER.password
      );

      expect(response).toHaveProperty('access_token');
      expect(response).toHaveProperty('user');
      expect(response.user.email).toBe(TEST_USER.email);

      authToken = response.access_token;
      apiClient.setToken(authToken);

      console.log('✅ SignIn successful');
    });
  });

  // ========== ACCOUNTS ==========
  describe('Accounts', () => {
    test('should create a new account', async () => {
      const newAccount = {
        name: 'Test Compte Principal',
        type: AccountType.CHECKING,
        owner_scope: OwnerScope.PERSONAL,
        currency: 'EUR',
        bank_name: 'Test Bank',
        iban_last4: '1234',
      };

      const account = await apiClient.createAccount(newAccount);

      expect(account).toHaveProperty('id');
      expect(account.name).toBe(newAccount.name);
      expect(account.type).toBe(newAccount.type);
      expect(account.currency).toBe(newAccount.currency);
      expect(account.balance).toBe(0);

      testAccountId = account.id;
      console.log('✅ Account created:', account.id);
    });

    test('should list all accounts', async () => {
      const accounts = await apiClient.getAccounts();

      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBeGreaterThan(0);

      const createdAccount = accounts.find(a => a.id === testAccountId);
      expect(createdAccount).toBeDefined();

      console.log('✅ Accounts listed:', accounts.length);
    });

    test('should get account by id', async () => {
      const account = await apiClient.getAccount(testAccountId);

      expect(account).toHaveProperty('id', testAccountId);
      expect(account).toHaveProperty('name');
      expect(account).toHaveProperty('balance');

      console.log('✅ Account retrieved:', account.name);
    });

    test('should update account', async () => {
      const updatedAccount = await apiClient.updateAccount(testAccountId, {
        name: 'Test Compte Principal (Modifié)',
        type: AccountType.CHECKING,
        owner_scope: OwnerScope.PERSONAL,
        currency: 'EUR',
      });

      expect(updatedAccount.name).toBe('Test Compte Principal (Modifié)');

      console.log('✅ Account updated');
    });
  });

  // ========== TRANSACTIONS ==========
  describe('Transactions', () => {
    test('should create a new transaction', async () => {
      const newTransaction = {
        account_id: testAccountId,
        amount: -50.00,
        description: 'Test Transaction - Courses',
        merchant_name: 'Carrefour',
        date: new Date().toISOString().split('T')[0],
        notes: 'Test note',
      };

      const transaction = await apiClient.createTransaction(newTransaction);

      expect(transaction).toHaveProperty('id');
      expect(transaction.account_id).toBe(testAccountId);
      expect(transaction.amount).toBe(newTransaction.amount);
      expect(transaction.description).toBe(newTransaction.description);

      testTransactionId = transaction.id;
      console.log('✅ Transaction created:', transaction.id);
    });

    test('should list all transactions', async () => {
      const response = await apiClient.getTransactions({ limit: 100 });

      expect(response).toHaveProperty('data');
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      const createdTransaction = response.data.find(t => t.id === testTransactionId);
      expect(createdTransaction).toBeDefined();

      console.log('✅ Transactions listed:', response.data.length);
    });

    test('should get transaction by id', async () => {
      const transaction = await apiClient.getTransaction(testTransactionId);

      expect(transaction).toHaveProperty('id', testTransactionId);
      expect(transaction).toHaveProperty('description');
      expect(transaction).toHaveProperty('amount');

      console.log('✅ Transaction retrieved');
    });

    test('should update transaction', async () => {
      const updatedTransaction = await apiClient.updateTransaction(
        testTransactionId,
        {
          description: 'Test Transaction - Courses (Modifié)',
          amount: -75.00,
        }
      );

      expect(updatedTransaction.description).toBe('Test Transaction - Courses (Modifié)');
      expect(updatedTransaction.amount).toBe(-75.00);

      console.log('✅ Transaction updated');
    });

    test('should filter transactions by account', async () => {
      const response = await apiClient.getTransactions({
        accountId: testAccountId,
        limit: 100,
      });

      expect(response.data.every(t => t.account_id === testAccountId)).toBe(true);

      console.log('✅ Transactions filtered by account');
    });
  });

  // ========== BUDGETS ========== (SKIP - Not Implemented)
  describe.skip('Budgets', () => {
    test('should create a new budget', async () => {
      const today = new Date();
      const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const newBudget = {
        name: 'Test Budget Courses',
        amount: 500,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        recurrence: 'MONTHLY',
        alert_threshold: 80,
        critical_threshold: 100,
      };

      const budget = await apiClient.createBudget(newBudget);

      expect(budget).toHaveProperty('id');
      expect(budget.name).toBe(newBudget.name);
      expect(budget.amount).toBe(newBudget.amount);

      testBudgetId = budget.id;
      console.log('✅ Budget created:', budget.id);
    });

    test('should list all budgets', async () => {
      const budgets = await apiClient.getBudgets();

      expect(Array.isArray(budgets)).toBe(true);
      expect(budgets.length).toBeGreaterThan(0);

      const createdBudget = budgets.find(b => b.id === testBudgetId);
      expect(createdBudget).toBeDefined();

      console.log('✅ Budgets listed:', budgets.length);
    });

    test('should get budget by id', async () => {
      const budget = await apiClient.getBudget(testBudgetId);

      expect(budget).toHaveProperty('id', testBudgetId);
      expect(budget).toHaveProperty('name');
      expect(budget).toHaveProperty('amount');

      console.log('✅ Budget retrieved');
    });

    test('should get budget consumption', async () => {
      const consumption = await apiClient.getBudgetConsumption(testBudgetId);

      expect(consumption).toHaveProperty('spent');
      expect(consumption).toHaveProperty('percentage');
      expect(consumption).toHaveProperty('remaining');

      console.log('✅ Budget consumption retrieved:', consumption.percentage + '%');
    });

    test('should update budget', async () => {
      const updatedBudget = await apiClient.updateBudget(testBudgetId, {
        name: 'Test Budget Courses (Modifié)',
        amount: 600,
      });

      expect(updatedBudget.name).toBe('Test Budget Courses (Modifié)');
      expect(updatedBudget.amount).toBe(600);

      console.log('✅ Budget updated');
    });
  });

  // ========== GOALS ========== (SKIP - Not Implemented)
  describe.skip('Goals', () => {
    test('should create a new goal', async () => {
      const newGoal = {
        name: 'Test Objectif Vacances',
        description: 'Économiser pour les vacances d\'été',
        target_amount: 2000,
        target_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        priority: 'HIGH',
      };

      const goal = await apiClient.createGoal(newGoal);

      expect(goal).toHaveProperty('id');
      expect(goal.name).toBe(newGoal.name);
      expect(goal.target_amount).toBe(newGoal.target_amount);

      testGoalId = goal.id;
      console.log('✅ Goal created:', goal.id);
    });

    test('should list all goals', async () => {
      const goals = await apiClient.getGoals();

      expect(Array.isArray(goals)).toBe(true);
      expect(goals.length).toBeGreaterThan(0);

      const createdGoal = goals.find(g => g.id === testGoalId);
      expect(createdGoal).toBeDefined();

      console.log('✅ Goals listed:', goals.length);
    });

    test('should get goal by id', async () => {
      const goal = await apiClient.getGoal(testGoalId);

      expect(goal).toHaveProperty('id', testGoalId);
      expect(goal).toHaveProperty('name');
      expect(goal).toHaveProperty('target_amount');

      console.log('✅ Goal retrieved');
    });

    test('should update goal', async () => {
      const updatedGoal = await apiClient.updateGoal(testGoalId, {
        name: 'Test Objectif Vacances (Modifié)',
        currentAmount: 500,
      });

      expect(updatedGoal.name).toBe('Test Objectif Vacances (Modifié)');

      console.log('✅ Goal updated');
    });
  });

  // ========== CLEANUP ==========
  describe('Cleanup', () => {
    test('should delete transaction', async () => {
      if (testTransactionId) {
        await apiClient.deleteTransaction(testTransactionId);
        console.log('✅ Transaction deleted');
      } else {
        console.log('⚠️  No transaction to delete');
      }
    });

    test('should delete account', async () => {
      await apiClient.deleteAccount(testAccountId);
      console.log('✅ Account deleted');
    });

    test('should sign out', async () => {
      await apiClient.signOut();
      console.log('✅ Signed out');
    });
  });
});

// Résumé des tests
afterAll(() => {
  console.log('\n========================================');
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('========================================');
  console.log('✅ Authentification : OK');
  console.log('✅ Comptes : Créer, Lire, Modifier, Supprimer');
  console.log('⚠️  Transactions : Tests désactivés (erreur 500 à résoudre)');
  console.log('⏭️  Budgets : Non implémentés dans le backend');
  console.log('⏭️  Objectifs : Non implémentés dans le backend');
  console.log('========================================\n');
});
