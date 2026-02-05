import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { formatCurrency, formatPercentage } from '@shared/utils/formatters';
import { Target, CheckCircle, PauseCircle, XCircle, Calendar, PiggyBank } from 'lucide-react-native';
import type { GoalStatus } from '@finopt/shared';

interface GoalCardProps {
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  status: GoalStatus;
  monthlySavingTarget?: number;
  currency?: string;
  onPress?: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  title,
  description,
  targetAmount,
  currentAmount,
  targetDate,
  status,
  monthlySavingTarget,
  currency = 'EUR',
  onPress,
}) => {
  const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const remaining = targetAmount - currentAmount;

  // Calculer les jours restants
  const today = new Date();
  const target = new Date(targetDate);
  const daysRemaining = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Calculer l'épargne mensuelle nécessaire
  const calculatedMonthlySaving = (() => {
    if (remaining <= 0 || daysRemaining <= 0) return null;
    const monthsRemaining = daysRemaining / 30;
    return remaining / monthsRemaining;
  })();

  const displayMonthlySaving = monthlySavingTarget || calculatedMonthlySaving;

  // Icône selon le status
  const getStatusIcon = () => {
    const iconSize = 24;
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle size={iconSize} color={colors.status.success} />;
      case 'PAUSED':
        return <PauseCircle size={iconSize} color={colors.neutral[500]} />;
      case 'CANCELLED':
        return <XCircle size={iconSize} color={colors.status.error} />;
      default:
        return <Target size={iconSize} color={colors.primary.main} />;
    }
  };

  // Couleur selon le status
  const getStatusColor = () => {
    switch (status) {
      case 'COMPLETED':
        return colors.status.success;
      case 'PAUSED':
        return colors.neutral[500];
      case 'CANCELLED':
        return colors.status.error;
      default:
        return colors.primary.main;
    }
  };

  // Label du status
  const getStatusLabel = () => {
    switch (status) {
      case 'COMPLETED':
        return 'Complété';
      case 'PAUSED':
        return 'En pause';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return 'En cours';
    }
  };

  // Couleur de la barre de progression
  const getProgressColor = () => {
    if (status === 'COMPLETED') return colors.status.success;
    if (status === 'CANCELLED' || status === 'PAUSED') return colors.neutral[400];
    if (percentage >= 75) return colors.status.success;
    if (percentage >= 50) return colors.primary.main;
    if (percentage >= 25) return colors.status.info;
    return colors.status.warning;
  };

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.icon}>{getStatusIcon()}</View>
          <View style={styles.titleInfo}>
            <Text style={styles.title}>{title}</Text>
            {description && <Text style={styles.description}>{description}</Text>}
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusLabel()}
          </Text>
        </View>
      </View>

      {/* Montants */}
      <View style={styles.amountsContainer}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Actuel</Text>
          <Text style={[styles.amountValue, { color: colors.status.success }]}>
            {formatCurrency(currentAmount, currency)}
          </Text>
        </View>

        <Text style={styles.separator}>/</Text>

        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Objectif</Text>
          <Text style={styles.amountValue}>{formatCurrency(targetAmount, currency)}</Text>
        </View>
      </View>

      {/* Barre de progression */}
      <View style={styles.progressBar}>
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

      <View style={styles.progressInfo}>
        <Text
          style={[
            styles.percentage,
            { color: status === 'ACTIVE' ? colors.primary.main : colors.neutral[600] },
          ]}
        >
          {formatPercentage(percentage, 0)}
        </Text>
        <Text style={styles.remaining}>
          Reste: {formatCurrency(remaining > 0 ? remaining : 0, currency)}
        </Text>
      </View>

      {/* Footer avec date et épargne mensuelle */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Calendar size={14} color={colors.neutral[600]} style={{ marginRight: 4 }} />
          <Text style={styles.footerLabel}>
            {daysRemaining > 0 ? `${daysRemaining} jours restants` : 'Date dépassée'}
          </Text>
        </View>

        {displayMonthlySaving && displayMonthlySaving > 0 && status === 'ACTIVE' && (
          <View style={styles.footerItem}>
            <PiggyBank size={14} color={colors.primary.main} style={{ marginRight: 4 }} />
            <Text style={[styles.footerLabel, { color: colors.primary.main, fontWeight: '600' }]}>
              {formatCurrency(displayMonthlySaving, currency)}/mois
            </Text>
          </View>
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
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  icon: {
    marginRight: spacing.sm,
    justifyContent: 'center',
  },
  titleInfo: {
    flex: 1,
  },
  title: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  description: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
    lineHeight: typography.body.small.lineHeight * 1.3,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: typography.body.tiny.fontSize,
    fontWeight: '600',
  },
  amountsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: typography.body.tiny.fontSize,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  amountValue: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
  },
  separator: {
    fontSize: typography.heading.h3.fontSize,
    color: colors.neutral[300],
    marginHorizontal: spacing.md,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.neutral[200],
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  percentage: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
  },
  remaining: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
  },
});
