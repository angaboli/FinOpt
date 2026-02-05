/**
 * Transaction Detail Screen - View, edit, delete a transaction
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Calendar, Tag, CreditCard, FileText, Clock, Trash2, Pencil } from 'lucide-react-native';
import { Card } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { formatCurrency } from '@shared/utils/formatters';
import { apiClient } from '../lib/api';
import { useDataStore } from '../store';

export default function TransactionDetailScreen({ navigation, route }: any) {
  const { transaction } = route.params;
  const { fetchTransactions, categories, accounts } = useDataStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const isExpense = Number(transaction.amount) < 0;
  const amount = Math.abs(Number(transaction.amount));
  const categoryName = categories.find((c) => c.id === transaction.categoryId)?.name || 'Non catégorisé';
  const accountName = accounts.find((a) => a.id === transaction.accountId)?.name || 'Compte inconnu';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleEdit = () => {
    navigation.navigate('AddTransaction', { transaction, isEdit: true });
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la transaction',
      'Voulez-vous vraiment supprimer cette transaction ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await apiClient.deleteTransaction(transaction.id);
              await fetchTransactions({ limit: 100 });
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Détail</Text>
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
        {/* Amount Card */}
        <View style={[styles.amountCard, isExpense ? styles.expenseCard : styles.incomeCard]}>
          <View style={styles.amountIcon}>
            {isExpense
              ? <ArrowDownLeft size={32} color={colors.status.error} />
              : <ArrowUpRight size={32} color={colors.status.success} />
            }
          </View>
          <Text style={[styles.amountText, { color: isExpense ? colors.status.error : colors.status.success }]}>
            {isExpense ? '-' : '+'}{formatCurrency(amount, transaction.currency || 'EUR')}
          </Text>
          <Text style={styles.amountLabel}>{isExpense ? 'Dépense' : 'Revenu'}</Text>
        </View>

        {/* Description */}
        <Card style={styles.card}>
          <Text style={styles.transactionDescription}>{transaction.description}</Text>
          {transaction.merchantName && (
            <Text style={styles.merchantName}>{transaction.merchantName}</Text>
          )}
        </Card>

        {/* Details */}
        <Card style={styles.card}>
          <DetailRow icon={<Calendar size={18} color={colors.neutral[600]} />} label="Date" value={formatDate(transaction.date)} />
          <View style={styles.divider} />
          <DetailRow icon={<Tag size={18} color={colors.neutral[600]} />} label="Catégorie" value={categoryName} />
          <View style={styles.divider} />
          <DetailRow icon={<CreditCard size={18} color={colors.neutral[600]} />} label="Compte" value={accountName} />
          <View style={styles.divider} />
          <DetailRow icon={<Clock size={18} color={colors.neutral[600]} />} label="Statut" value={transaction.status || 'COMPLETED'} />
          {transaction.notes && (
            <>
              <View style={styles.divider} />
              <DetailRow icon={<FileText size={18} color={colors.neutral[600]} />} label="Notes" value={transaction.notes} />
            </>
          )}
        </Card>

        {/* Tags */}
        {transaction.tags && transaction.tags.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.detailLabel}>Tags</Text>
            <View style={styles.tagsContainer}>
              {transaction.tags.map((tag: string, i: number) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        {icon}
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
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
  amountCard: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  expenseCard: {
    backgroundColor: colors.status.errorLight,
  },
  incomeCard: {
    backgroundColor: colors.status.successLight,
  },
  amountIcon: {
    marginBottom: spacing.sm,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '700',
  },
  amountLabel: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[600],
    marginTop: spacing.xs,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  transactionDescription: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  merchantName: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[600],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[600],
  },
  detailValue: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[800],
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '50%',
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primary.light + '30',
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagText: {
    fontSize: typography.body.small.fontSize,
    color: colors.primary.dark,
    fontWeight: '500',
  },
});
