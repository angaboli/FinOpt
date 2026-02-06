import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { colors } from '@shared/constants/colors';
import { spacing, borderRadius } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { formatCurrency, formatRelativeDate } from '@shared/utils/formatters';
import type { Transaction } from '@finopt/shared';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  const isExpense = transaction.amount < 0;
  const isIncome = transaction.amount > 0;

  const Icon = isIncome ? ArrowUpRight : ArrowDownLeft;
  const iconColor = isIncome ? colors.status.success : colors.status.error;
  const iconBg = isIncome ? '#ECFDF5' : '#FEF2F2';
  const amountColor = isExpense
    ? colors.status.error
    : isIncome
    ? colors.status.success
    : colors.neutral[700];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(transaction)}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Icon size={22} color={iconColor} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description || transaction.merchantName || 'Transaction'}
        </Text>
        <Text style={styles.date}>{formatRelativeDate(new Date(transaction.date))}</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {formatCurrency(transaction.amount, transaction.currency)}
        </Text>
        {transaction.status === 'PENDING' && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>En attente</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  description: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '500',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  date: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[500],
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
  },
  pendingBadge: {
    marginTop: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.status.warningLight,
    borderRadius: borderRadius.sm,
  },
  pendingText: {
    fontSize: typography.body.tiny.fontSize,
    color: colors.status.warning,
    fontWeight: '500',
  },
});
