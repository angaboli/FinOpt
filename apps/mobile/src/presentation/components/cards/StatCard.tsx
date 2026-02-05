import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react-native';
import { Card } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { formatCurrency, formatPercentage } from '@shared/utils/formatters';

export type StatType = 'income' | 'expense' | 'savings';

interface StatCardProps {
  type: StatType;
  amount: number;
  currency?: string;
  change?: number; // Percentage change from previous period
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  type,
  amount,
  currency = 'EUR',
  change,
  onPress,
}) => {
  const config = getStatConfig(type);
  const hasIncrease = change !== undefined && change > 0;
  const hasDecrease = change !== undefined && change < 0;

  return (
    <Card style={styles.card} onPress={onPress} elevated>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          {config.icon}
        </View>
        {change !== undefined && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: hasIncrease
                  ? colors.status.successLight
                  : hasDecrease
                  ? colors.status.errorLight
                  : colors.neutral[100],
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: hasIncrease
                    ? colors.status.success
                    : hasDecrease
                    ? colors.status.error
                    : colors.neutral[600],
                },
              ]}
            >
              {hasIncrease ? '↑' : hasDecrease ? '↓' : '−'} {formatPercentage(Math.abs(change))}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.label}>{config.label}</Text>
      <Text style={[styles.amount, { color: config.color }]}>
        {formatCurrency(amount, currency)}
      </Text>
    </Card>
  );
};

function getStatConfig(type: StatType) {
  switch (type) {
    case 'income':
      return {
        label: 'Revenus',
        icon: <TrendingUp size={20} color={colors.status.success} />,
        color: colors.status.success,
        bgColor: colors.status.successLight,
      };
    case 'expense':
      return {
        label: 'Dépenses',
        icon: <TrendingDown size={20} color={colors.status.error} />,
        color: colors.status.error,
        bgColor: colors.status.errorLight,
      };
    case 'savings':
      return {
        label: 'Économies',
        icon: <PiggyBank size={20} color={colors.primary.main} />,
        color: colors.primary.main,
        bgColor: colors.primary.light,
      };
  }
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: typography.body.tiny.fontSize,
    fontWeight: '600',
  },
  label: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  amount: {
    fontSize: typography.amount.small.fontSize,
    fontWeight: typography.amount.small.fontWeight,
    lineHeight: typography.amount.small.lineHeight,
  },
});
