import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Card } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { formatCurrency } from '@shared/utils/formatters';
import { renderCategoryIcon } from '@shared/utils/categoryIcons';

interface BudgetCardProps {
  categoryName: string;
  budgetAmount: number;
  spent: number;
  currency?: string;
  onPress?: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  categoryName,
  budgetAmount,
  spent,
  currency = 'EUR',
  onPress,
}) => {
  const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
  const remaining = budgetAmount - spent;
  const isOverBudget = spent > budgetAmount;
  const isWarning = percentage >= 80 && !isOverBudget;

  // Couleur de la barre de progression
  const getProgressColor = () => {
    if (isOverBudget) return colors.status.error;
    if (isWarning) return colors.status.warning;
    return colors.status.success;
  };

  // Couleur de fond de la barre
  const getProgressBackgroundColor = () => {
    if (isOverBudget) return colors.status.errorLight;
    if (isWarning) return colors.status.warningLight;
    return colors.status.successLight;
  };

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.categoryInfo}>
          <View style={styles.iconWrapper}>
            {renderCategoryIcon(categoryName, 24, colors.primary.main)}
          </View>
          <View>
            <Text style={styles.categoryName}>{categoryName}</Text>
            <Text style={styles.amounts}>
              {formatCurrency(spent, currency)} / {formatCurrency(budgetAmount, currency)}
            </Text>
          </View>
        </View>

        <View style={styles.percentageContainer}>
          <Text
            style={[
              styles.percentage,
              {
                color: isOverBudget
                  ? colors.status.error
                  : isWarning
                  ? colors.status.warning
                  : colors.status.success,
              },
            ]}
          >
            {percentage.toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* Barre de progression */}
      <View style={[styles.progressBar, { backgroundColor: getProgressBackgroundColor() }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: getProgressColor(),
            },
          ]}
        />
      </View>

      {/* Remaining */}
      <View style={styles.footer}>
        {isOverBudget ? (
          <View style={styles.overBudgetRow}>
            <AlertTriangle size={14} color={colors.status.error} />
            <Text style={[styles.remainingText, { color: colors.status.error }]}>
              Dépassement de {formatCurrency(Math.abs(remaining), currency)}
            </Text>
          </View>
        ) : (
          <Text style={styles.remainingText}>
            Reste: {formatCurrency(remaining, currency)}
          </Text>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    marginRight: spacing.sm,
  },
  overBudgetRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  categoryName: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  amounts: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
  },
  percentageContainer: {
    alignItems: 'flex-end',
  },
  percentage: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingText: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
  },
});
