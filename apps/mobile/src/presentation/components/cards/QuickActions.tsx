import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DollarSign, CreditCard, BarChart3, Target } from 'lucide-react-native';
import { colors } from '@shared/constants/colors';
import { spacing, borderRadius } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  onPress: () => void;
}

interface QuickActionsProps {
  actions?: QuickAction[];
}

const defaultActions: QuickAction[] = [
  {
    id: 'add-income',
    label: 'Revenus',
    icon: <DollarSign size={28} color={colors.status.success} />,
    color: colors.status.success,
    onPress: () => console.log('Add income'),
  },
  {
    id: 'add-expense',
    label: 'Dépenses',
    icon: <CreditCard size={28} color={colors.status.error} />,
    color: colors.status.error,
    onPress: () => console.log('Add expense'),
  },
  {
    id: 'view-budget',
    label: 'Budget',
    icon: <BarChart3 size={28} color={colors.primary.main} />,
    color: colors.primary.main,
    onPress: () => console.log('View budget'),
  },
  {
    id: 'view-goals',
    label: 'Objectifs',
    icon: <Target size={28} color={colors.status.info} />,
    color: colors.status.info,
    onPress: () => console.log('View goals'),
  },
];

export const QuickActions: React.FC<QuickActionsProps> = ({ actions = defaultActions }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Actions Rapides</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${action.color}15` }]}>
              {action.icon}
            </View>
            <Text style={styles.label}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  title: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
  },
  actionButton: {
    width: '25%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[700],
    textAlign: 'center',
  },
});
