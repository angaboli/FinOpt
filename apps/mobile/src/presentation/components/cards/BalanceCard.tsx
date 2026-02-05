import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { formatCurrency } from '@shared/utils/formatters';

interface BalanceCardProps {
  balance: number;
  currency?: string;
  lastUpdated?: Date;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  currency = 'EUR',
  lastUpdated,
}) => {
  const isPositive = balance >= 0;

  return (
    <Card style={styles.card} elevated>
      <View style={styles.container}>
        <Text style={styles.label}>Solde Total</Text>
        <Text
          style={[
            styles.amount,
            { color: isPositive ? colors.neutral.white : colors.status.error },
          ]}
        >
          {formatCurrency(balance, currency)}
        </Text>
        {lastUpdated && (
          <Text style={styles.lastUpdated}>
            Mis à jour il y a {getRelativeTime(lastUpdated)}
          </Text>
        )}
      </View>
    </Card>
  );
};

// Helper to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'quelques secondes';
  if (diffMins < 60) return `${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}j`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary.main,
    margin: spacing.md,
  },
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  label: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '500',
    color: colors.neutral.white,
    marginBottom: spacing.sm,
    opacity: 0.9,
  },
  amount: {
    fontSize: typography.amount.large.fontSize,
    fontWeight: typography.amount.large.fontWeight,
    lineHeight: typography.amount.large.lineHeight,
    color: colors.neutral.white,
  },
  lastUpdated: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral.white,
    marginTop: spacing.sm,
    opacity: 0.7,
  },
});
