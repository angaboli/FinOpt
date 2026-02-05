/**
 * Dashboard Screen - Financial Overview
 *
 * Displays:
 * - Balance Card with total balance
 * - Stats Cards (Income, Expenses, Savings)
 * - Quick Actions
 * - Recent Transactions
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useDataStore } from '../store';
import { BalanceCard, StatCard, QuickActions, TransactionItem } from '@presentation/components/cards';
import { LoadingSpinner, ErrorMessage } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';

export default function DashboardScreen() {
  const { accounts, transactions, budgets, categories, fetchAccounts, fetchTransactions, fetchBudgets, fetchCategories, isLoading } = useDataStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      await Promise.all([fetchAccounts(), fetchTransactions({ limit: 10 }), fetchBudgets(), fetchCategories()]);
    } catch (err) {
      setError('Impossible de charger les données');
    }
  };

  // Calculate statistics
  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  const thisMonthTransactions = transactions.filter((t) => {
    const txDate = new Date(t.date);
    const now = new Date();
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });

  const income = thisMonthTransactions
    .filter((t) => Number(t.amount) > 0)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = thisMonthTransactions
    .filter((t) => Number(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  const savings = income - expenses;

  const recentTransactions = transactions.slice(0, 5);

  if (error && !isLoading) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error}
          onRetry={loadData}
          fullScreen
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour 👋</Text>
        <Text style={styles.subtitle}>Voici votre aperçu financier</Text>
      </View>

      {/* Balance Card */}
      <BalanceCard balance={totalBalance} currency="EUR" lastUpdated={new Date()} />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard type="income" amount={income} currency="EUR" change={5.2} />
        <StatCard type="expense" amount={expenses} currency="EUR" change={-3.1} />
      </View>

      <View style={styles.statsRow}>
        <StatCard type="savings" amount={savings} currency="EUR" change={12.5} />
      </View>

      {/* Quick Actions */}
      <QuickActions />

      {/* Budget Alerts */}
      {budgets.length > 0 && (() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const alerts = budgets.map((b) => {
          const spent = transactions
            .filter((t) => {
              const txDate = new Date(t.date);
              return (
                t.categoryId === b.categoryId &&
                Number(t.amount) < 0 &&
                txDate.getMonth() === currentMonth &&
                txDate.getFullYear() === currentYear
              );
            })
            .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
          const pct = b.amount > 0 ? spent / b.amount : 0;
          const catName = categories.find((c) => c.id === b.categoryId)?.name || 'Budget';
          return { id: b.id, catName, spent, amount: b.amount, pct };
        }).filter((a) => a.pct >= 0.8);

        if (alerts.length === 0) return null;
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alertes Budget</Text>
            {alerts.map((a) => (
              <View key={a.id} style={[styles.alertCard, a.pct >= 1 ? styles.alertDanger : styles.alertWarning]}>
                <Text style={styles.alertText}>
                  {a.pct >= 1 ? '🔴' : '🟡'} {a.catName}: {a.spent.toFixed(0)}€ / {a.amount.toFixed(0)}€ ({(a.pct * 100).toFixed(0)}%)
                </Text>
              </View>
            ))}
          </View>
        );
      })()}

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions Récentes</Text>
          <Text style={styles.seeAll}>Voir tout</Text>
        </View>

        {isLoading && recentTransactions.length === 0 ? (
          <LoadingSpinner message="Chargement des transactions..." />
        ) : recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={styles.emptyStateText}>Aucune transaction récente</Text>
          </View>
        ) : (
          recentTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onPress={(t) => console.log('Transaction pressed:', t.id)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: typography.heading.h1.fontSize,
    fontWeight: typography.heading.h1.fontWeight,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[600],
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
  },
  seeAll: {
    fontSize: typography.body.regular.fontSize,
    color: colors.primary.main,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[500],
  },
  alertCard: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  alertWarning: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  alertDanger: {
    backgroundColor: '#F8D7DA',
    borderWidth: 1,
    borderColor: '#F5C6CB',
  },
  alertText: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[800],
    fontWeight: '500',
  },
});
