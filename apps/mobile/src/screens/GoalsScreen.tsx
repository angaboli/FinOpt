/**
 * Goals Screen - Manage financial goals and track progress
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
import { GoalCard } from '@presentation/components/cards';
import { LoadingSpinner, ErrorMessage } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { formatCurrency } from '@shared/utils/formatters';
import type { Goal } from '@finopt/shared';

export default function GoalsScreen({ navigation }: any) {
  const { goals, fetchGoals, isLoading } = useDataStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      await fetchGoals();
    } catch (err) {
      setError('Impossible de charger les objectifs');
      console.error('Failed to load goals:', err);
    }
  };

  const handleAddGoal = () => {
    navigation.navigate('AddGoal');
  };

  const handleGoalPress = (goal: Goal) => {
    navigation.navigate('EditGoal', { goal });
  };

  // Trier les objectifs par status et priorité
  const sortedGoals = [...goals].sort((a, b) => {
    // 1. Objectifs actifs en premier
    if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
    if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;

    // 2. Complétés en dernier
    if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
    if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;

    // 3. Par priorité (plus petit nombre = plus haute priorité)
    return a.priority - b.priority;
  });

  // Statistiques globales
  const activeGoals = goals.filter((g) => g.status === 'ACTIVE');
  const totalTargetAmount = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrentAmount = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalRemaining = totalTargetAmount - totalCurrentAmount;
  const overallPercentage = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  // Calculer l'épargne mensuelle totale recommandée
  const totalMonthlySaving = activeGoals.reduce((sum, goal) => {
    if (goal.plan?.monthlySavingTarget) {
      return sum + goal.plan.monthlySavingTarget;
    }
    return sum;
  }, 0);

  if (error && !isLoading && goals.length === 0) {
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
        <Text style={styles.title}>Objectifs</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}>
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        {activeGoals.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📊 Vue d'Ensemble</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Objectifs actifs</Text>
                <Text style={styles.summaryValue}>{activeGoals.length}</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Progression</Text>
                <Text style={styles.summaryValue}>{Math.round(overallPercentage)}%</Text>
              </View>
            </View>

            <View style={styles.summaryAmounts}>
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Épargné</Text>
                <Text style={[styles.amountValue, { color: colors.status.success }]}>
                  {formatCurrency(totalCurrentAmount, 'EUR')}
                </Text>
              </View>

              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Reste</Text>
                <Text style={styles.amountValue}>{formatCurrency(totalRemaining, 'EUR')}</Text>
              </View>
            </View>

            {totalMonthlySaving > 0 && (
              <View style={styles.monthlySavingBox}>
                <Text style={styles.monthlySavingLabel}>💰 Épargne mensuelle recommandée</Text>
                <Text style={styles.monthlySavingValue}>
                  {formatCurrency(totalMonthlySaving, 'EUR')}/mois
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Goals List */}
        {isLoading && goals.length === 0 ? (
          <LoadingSpinner message="Chargement des objectifs..." />
        ) : goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎯</Text>
            <Text style={styles.emptyStateTitle}>Aucun objectif</Text>
            <Text style={styles.emptyStateText}>
              Définissez vos objectifs financiers pour mieux planifier votre épargne
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddGoal}>
              <Text style={styles.emptyStateButtonText}>+ Créer un objectif</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.goalsList}>
            {activeGoals.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Objectifs Actifs</Text>
                {sortedGoals
                  .filter((g) => g.status === 'ACTIVE')
                  .map((goal) => (
                    <GoalCard
                      key={goal.id}
                      title={goal.title}
                      description={goal.description}
                      targetAmount={goal.targetAmount}
                      currentAmount={goal.currentAmount}
                      targetDate={goal.targetDate}
                      status={goal.status}
                      monthlySavingTarget={goal.plan?.monthlySavingTarget}
                      currency="EUR"
                      onPress={() => handleGoalPress(goal)}
                    />
                  ))}
              </>
            )}

            {/* Objectifs complétés */}
            {sortedGoals.filter((g) => g.status === 'COMPLETED').length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
                  Objectifs Complétés ✨
                </Text>
                {sortedGoals
                  .filter((g) => g.status === 'COMPLETED')
                  .map((goal) => (
                    <GoalCard
                      key={goal.id}
                      title={goal.title}
                      description={goal.description}
                      targetAmount={goal.targetAmount}
                      currentAmount={goal.currentAmount}
                      targetDate={goal.targetDate}
                      status={goal.status}
                      currency="EUR"
                      onPress={() => handleGoalPress(goal)}
                    />
                  ))}
              </>
            )}

            {/* Objectifs en pause ou annulés */}
            {sortedGoals.filter((g) => g.status === 'PAUSED' || g.status === 'CANCELLED').length >
              0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Autres</Text>
                {sortedGoals
                  .filter((g) => g.status === 'PAUSED' || g.status === 'CANCELLED')
                  .map((goal) => (
                    <GoalCard
                      key={goal.id}
                      title={goal.title}
                      description={goal.description}
                      targetAmount={goal.targetAmount}
                      currentAmount={goal.currentAmount}
                      targetDate={goal.targetDate}
                      status={goal.status}
                      monthlySavingTarget={goal.plan?.monthlySavingTarget}
                      currency="EUR"
                      onPress={() => handleGoalPress(goal)}
                    />
                  ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
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
    backgroundColor: colors.neutral.white,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  summaryTitle: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: typography.heading.h2.fontSize,
    fontWeight: typography.heading.h2.fontWeight,
    color: colors.primary.main,
  },
  summaryAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  amountBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    marginHorizontal: spacing.xs,
  },
  amountLabel: {
    fontSize: typography.body.tiny.fontSize,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  amountValue: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  monthlySavingBox: {
    backgroundColor: colors.primary.light + '20',
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  monthlySavingLabel: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  monthlySavingValue: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.primary.main,
  },
  goalsList: {
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
