/**
 * Budget Detail Screen - View budget details with related transactions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { Card } from '@presentation/components/common';
import { TransactionItem } from '@presentation/components/cards';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { formatCurrency } from '@shared/utils/formatters';
import { apiClient } from '../lib/api';
import { useDataStore } from '../store';

export default function BudgetDetailScreen({ navigation, route }: any) {
  const { budget } = route.params;
  const { transactions, categories, fetchBudgets, fetchTransactions } = useDataStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryName = categories.find((c) => c.id === budget.categoryId)?.name || 'Budget';
  const categoryIcon = categories.find((c) => c.id === budget.categoryId)?.icon || '';

  // Calculate spent for this budget
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const relatedTransactions = transactions.filter((t) => {
    const txDate = new Date(t.date);
    return (
      t.categoryId === budget.categoryId &&
      Number(t.amount) < 0 &&
      txDate.getMonth() === currentMonth &&
      txDate.getFullYear() === currentYear
    );
  });

  const spent = relatedTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  const remaining = budget.amount - spent;
  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

  const getProgressColor = () => {
    if (percentage >= 100) return colors.status.error;
    if (percentage >= 80) return colors.status.warning;
    return colors.status.success;
  };

  const handleEdit = () => {
    navigation.navigate('AddBudget', { budget, isEdit: true });
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le budget',
      `Voulez-vous vraiment supprimer le budget "${categoryName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await apiClient.deleteBudget(budget.id);
              await fetchBudgets();
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Erreur', err.response?.data?.detail || err.message || 'Impossible de supprimer');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleTransactionPress = (transaction: any) => {
    navigation.navigate('TransactionDetail', { transaction });
  };

  const formatPeriod = () => {
    if (budget.periodStart && budget.periodEnd) {
      const start = new Date(budget.periodStart);
      const end = new Date(budget.periodEnd);
      return `${start.toLocaleDateString('fr-FR')} - ${end.toLocaleDateString('fr-FR')}`;
    }
    return `${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{categoryName}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.headerIcon}>
            <Pencil size={20} color={colors.primary.main} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerIcon} disabled={isDeleting}>
            <Trash2 size={20} color={colors.status.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <View style={[styles.progressCard, { borderColor: getProgressColor() }]}>
          <Text style={styles.progressTitle}>Consommation du budget</Text>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(percentage, 100)}%`, backgroundColor: getProgressColor() },
              ]}
            />
          </View>

          <Text style={[styles.progressPercent, { color: getProgressColor() }]}>
            {percentage.toFixed(0)}%
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Budget</Text>
              <Text style={styles.statValue}>{formatCurrency(budget.amount, 'EUR')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Dépensé</Text>
              <Text style={[styles.statValue, { color: getProgressColor() }]}>
                {formatCurrency(spent, 'EUR')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Reste</Text>
              <Text style={[styles.statValue, { color: remaining < 0 ? colors.status.error : colors.status.success }]}>
                {formatCurrency(remaining, 'EUR')}
              </Text>
            </View>
          </View>
        </View>

        {/* Period */}
        <Card style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Période</Text>
            <Text style={styles.detailValue}>{formatPeriod()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Catégorie</Text>
            <Text style={styles.detailValue}>{categoryIcon} {categoryName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Seuil d'alerte</Text>
            <Text style={styles.detailValue}>{((budget.warningThreshold || 0.8) * 100).toFixed(0)}%</Text>
          </View>
        </Card>

        {/* Related Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>
            Transactions ({relatedTransactions.length})
          </Text>
          {relatedTransactions.length === 0 ? (
            <Card style={styles.card}>
              <Text style={styles.emptyText}>Aucune transaction ce mois-ci pour cette catégorie</Text>
            </Card>
          ) : (
            relatedTransactions.map((t) => (
              <TransactionItem key={t.id} transaction={t} onPress={handleTransactionPress} />
            ))
          )}
        </View>
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
  backButton: {
    fontSize: typography.body.regular.fontSize,
    color: colors.primary.main,
    fontWeight: '600',
  },
  title: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerIcon: {
    padding: spacing.xs,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  progressCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  progressBarContainer: {
    width: '100%',
    height: 16,
    backgroundColor: colors.neutral[200],
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 8,
  },
  progressPercent: {
    fontSize: typography.heading.h2.fontSize,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[600],
  },
  detailValue: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[800],
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  transactionsSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
