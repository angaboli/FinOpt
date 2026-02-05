/**
 * Budgets Screen - Manage budgets and track spending
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useDataStore } from '../store';
import { BudgetCard } from '@presentation/components/cards';
import { LoadingSpinner, ErrorMessage } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { formatCurrency } from '@shared/utils/formatters';
import type { Budget } from '@finopt/shared';

export default function BudgetsScreen({ navigation }: any) {
  const { budgets, transactions, fetchBudgets, fetchTransactions, isLoading } = useDataStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      await Promise.all([fetchBudgets(), fetchTransactions({ limit: 100 })]);
    } catch (err) {
      setError('Impossible de charger les budgets');
      console.error('Failed to load budgets:', err);
    }
  };

  // Calculer les dépenses par catégorie pour le mois en cours
  const calculateSpentByCategory = (categoryId: string): number => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter((t) => {
        const txDate = new Date(t.date);
        return (
          t.categoryId === categoryId &&
          t.amount < 0 && // Seulement les dépenses
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  // Enrichir les budgets avec les dépenses
  const enrichedBudgets = budgets.map((budget) => ({
    ...budget,
    spent: calculateSpentByCategory(budget.categoryId),
  }));

  // Statistiques globales
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = enrichedBudgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const handleAddBudget = () => {
    navigation.navigate('AddBudget');
  };

  const handleBudgetPress = (budget: Budget & { spent: number }) => {
    // TODO: Navigate to Budget Details
    console.log('Budget pressed:', budget);
  };

  if (error && !isLoading && budgets.length === 0) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={loadData} fullScreen />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Budgets</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddBudget}>
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        {budgets.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Budget Total du Mois</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Budget</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(totalBudget, 'EUR')}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Dépensé</Text>
                <Text
                  style={[
                    styles.summaryAmount,
                    { color: totalSpent > totalBudget ? colors.status.error : colors.neutral[800] },
                  ]}
                >
                  {formatCurrency(totalSpent, 'EUR')}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Reste</Text>
                <Text
                  style={[
                    styles.summaryAmount,
                    { color: totalRemaining < 0 ? colors.status.error : colors.status.success },
                  ]}
                >
                  {formatCurrency(totalRemaining, 'EUR')}
                </Text>
              </View>
            </View>

            {/* Overall Progress Bar */}
            <View style={styles.overallProgressBar}>
              <View
                style={[
                  styles.overallProgressFill,
                  {
                    width: `${Math.min(overallPercentage, 100)}%`,
                    backgroundColor:
                      overallPercentage >= 100
                        ? colors.status.error
                        : overallPercentage >= 80
                        ? colors.status.warning
                        : colors.status.success,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Budgets List */}
        {isLoading && budgets.length === 0 ? (
          <LoadingSpinner message="Chargement des budgets..." />
        ) : budgets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text style={styles.emptyStateTitle}>Aucun budget</Text>
            <Text style={styles.emptyStateText}>
              Créez votre premier budget pour suivre vos dépenses par catégorie
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddBudget}>
              <Text style={styles.emptyStateButtonText}>+ Créer un budget</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.budgetsList}>
            <Text style={styles.sectionTitle}>Budgets par Catégorie</Text>
            {enrichedBudgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                categoryName={getCategoryName(budget.categoryId)}
                categoryIcon={getCategoryIcon(budget.categoryId)}
                budgetAmount={budget.amount}
                spent={budget.spent}
                currency="EUR"
                onPress={() => handleBudgetPress(budget)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Helper functions (à remplacer par des appels API plus tard)
function getCategoryName(categoryId: string): string {
  const categories: Record<string, string> = {
    '1': 'Alimentation',
    '2': 'Transport',
    '3': 'Loisirs',
    '4': 'Santé',
    '5': 'Logement',
  };
  return categories[categoryId] || `Catégorie ${categoryId}`;
}

function getCategoryIcon(categoryId: string): string {
  const icons: Record<string, string> = {
    '1': '🍔',
    '2': '🚗',
    '3': '🎬',
    '4': '💊',
    '5': '🏠',
  };
  return icons[categoryId] || '📊';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.md,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  title: {
    fontSize: typography.heading.h2.fontSize,
    fontWeight: typography.heading.h2.fontWeight,
    color: colors.neutral[800],
  },
  addButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.neutral.white,
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.primary.main,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral.white,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral.white,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  summaryAmount: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral.white,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetsList: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  emptyStateText: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: colors.neutral.white,
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
  },
});
