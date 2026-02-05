/**
 * Tests Manuels - Script pour tester toutes les fonctionnalités
 *
 * Pour exécuter:
 * Importez et appelez runManualTests() depuis n'importe quel écran
 */

import { apiClient } from '../lib/api';
import { AccountType, OwnerScope } from '@finopt/shared';
import { Alert } from 'react-native';

export async function runManualTests() {
  const results: string[] = [];
  let allPassed = true;

  const addResult = (test: string, passed: boolean, message?: string) => {
    const icon = passed ? '✅' : '❌';
    results.push(`${icon} ${test}${message ? ': ' + message : ''}`);
    if (!passed) allPassed = false;
  };

  try {
    console.log('🧪 Démarrage des tests manuels...\n');

    // ========== TEST COMPTES ==========
    console.log('📝 Test des comptes...');
    let testAccountId: string;

    try {
      // Créer un compte
      const newAccount = await apiClient.createAccount({
        name: 'Test Manual Account',
        type: AccountType.CHECKING,
        owner_scope: OwnerScope.PERSONAL,
        currency: 'EUR',
      });
      testAccountId = newAccount.id;
      addResult('Création de compte', true, newAccount.name);

      // Lister les comptes
      const accounts = await apiClient.getAccounts();
      addResult('Liste des comptes', accounts.length > 0, `${accounts.length} compte(s)`);

      // Récupérer le compte
      const account = await apiClient.getAccount(testAccountId);
      addResult('Récupération du compte', account.id === testAccountId);

      // Modifier le compte
      await apiClient.updateAccount(testAccountId, {
        name: 'Test Manual Account (Modifié)',
        type: AccountType.CHECKING,
        owner_scope: OwnerScope.PERSONAL,
        currency: 'EUR',
      });
      addResult('Modification du compte', true);
    } catch (error: any) {
      addResult('Tests comptes', false, error.message);
    }

    // ========== TEST TRANSACTIONS ==========
    console.log('📝 Test des transactions...');
    let testTransactionId: string;

    try {
      // Créer une transaction
      const newTransaction = await apiClient.createTransaction({
        account_id: testAccountId,
        amount: -25.50,
        description: 'Test Transaction',
        merchant_name: 'Test Merchant',
        date: new Date().toISOString().split('T')[0],
      });
      testTransactionId = newTransaction.id;
      addResult('Création de transaction', true, newTransaction.description);

      // Lister les transactions
      const transactions = await apiClient.getTransactions({ limit: 100 });
      addResult('Liste des transactions', transactions.data.length > 0, `${transactions.data.length} transaction(s)`);

      // Récupérer la transaction
      const transaction = await apiClient.getTransaction(testTransactionId);
      addResult('Récupération de la transaction', transaction.id === testTransactionId);

      // Modifier la transaction
      await apiClient.updateTransaction(testTransactionId, {
        description: 'Test Transaction (Modifiée)',
      });
      addResult('Modification de la transaction', true);

      // Filtrer par compte
      const accountTransactions = await apiClient.getTransactions({
        accountId: testAccountId,
        limit: 100,
      });
      addResult('Filtrage par compte', accountTransactions.data.every(t => t.account_id === testAccountId));

      // Supprimer la transaction
      await apiClient.deleteTransaction(testTransactionId);
      addResult('Suppression de la transaction', true);
    } catch (error: any) {
      addResult('Tests transactions', false, error.message);
    }

    // ========== TEST BUDGETS ==========
    console.log('📝 Test des budgets...');
    let testBudgetId: string;

    try {
      const today = new Date();
      const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Créer un budget
      const newBudget = await apiClient.createBudget({
        name: 'Test Budget',
        amount: 300,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        recurrence: 'MONTHLY',
        alert_threshold: 80,
        critical_threshold: 100,
      });
      testBudgetId = newBudget.id;
      addResult('Création de budget', true, newBudget.name);

      // Lister les budgets
      const budgets = await apiClient.getBudgets();
      addResult('Liste des budgets', budgets.length > 0, `${budgets.length} budget(s)`);

      // Récupérer le budget
      const budget = await apiClient.getBudget(testBudgetId);
      addResult('Récupération du budget', budget.id === testBudgetId);

      // Consommation du budget
      const consumption = await apiClient.getBudgetConsumption(testBudgetId);
      addResult('Consommation du budget', consumption.hasOwnProperty('percentage'), `${consumption.percentage}%`);

      // Modifier le budget
      await apiClient.updateBudget(testBudgetId, {
        name: 'Test Budget (Modifié)',
      });
      addResult('Modification du budget', true);

      // Supprimer le budget
      await apiClient.deleteBudget(testBudgetId);
      addResult('Suppression du budget', true);
    } catch (error: any) {
      addResult('Tests budgets', false, error.message);
    }

    // ========== TEST OBJECTIFS ==========
    console.log('📝 Test des objectifs...');
    let testGoalId: string;

    try {
      // Créer un objectif
      const newGoal = await apiClient.createGoal({
        name: 'Test Goal',
        description: 'Test objectif manuel',
        target_amount: 1000,
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        priority: 'MEDIUM',
      });
      testGoalId = newGoal.id;
      addResult('Création d\'objectif', true, newGoal.name);

      // Lister les objectifs
      const goals = await apiClient.getGoals();
      addResult('Liste des objectifs', goals.length > 0, `${goals.length} objectif(s)`);

      // Récupérer l'objectif
      const goal = await apiClient.getGoal(testGoalId);
      addResult('Récupération de l\'objectif', goal.id === testGoalId);

      // Modifier l'objectif
      await apiClient.updateGoal(testGoalId, {
        name: 'Test Goal (Modifié)',
        currentAmount: 250,
      });
      addResult('Modification de l\'objectif', true);

      // Supprimer l'objectif
      await apiClient.deleteGoal(testGoalId);
      addResult('Suppression de l\'objectif', true);
    } catch (error: any) {
      addResult('Tests objectifs', false, error.message);
    }

    // ========== CLEANUP ==========
    console.log('📝 Nettoyage...');
    try {
      await apiClient.deleteAccount(testAccountId);
      addResult('Suppression du compte de test', true);
    } catch (error: any) {
      addResult('Nettoyage', false, error.message);
    }

    // ========== RÉSULTATS ==========
    console.log('\n========================================');
    console.log('📊 RÉSULTATS DES TESTS');
    console.log('========================================');
    results.forEach(r => console.log(r));
    console.log('========================================');
    console.log(allPassed ? '✅ TOUS LES TESTS ONT RÉUSSI !' : '❌ CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('========================================\n');

    // Afficher une alerte avec le résumé
    Alert.alert(
      allPassed ? '✅ Tests Réussis' : '⚠️ Tests Incomplets',
      `${results.filter(r => r.startsWith('✅')).length}/${results.length} tests réussis\n\nConsultez la console pour plus de détails`,
      [{ text: 'OK' }]
    );

    return { allPassed, results };
  } catch (error: any) {
    console.error('❌ Erreur lors des tests:', error);
    Alert.alert('Erreur', 'Une erreur est survenue lors des tests. Consultez la console.');
    return { allPassed: false, results: ['❌ Erreur globale: ' + error.message] };
  }
}

export default runManualTests;
