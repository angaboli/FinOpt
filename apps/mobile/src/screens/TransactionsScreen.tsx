/**
 * Transactions Screen - Complete transaction list with filters
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useDataStore } from '../store';
import { TransactionItem } from '@presentation/components/cards';
import { Input, LoadingSpinner, ErrorMessage, FilterChip } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import type { Transaction } from '@finopt/shared';

type FilterType = 'all' | 'income' | 'expense' | 'pending';

export default function TransactionsScreen({ navigation }: any) {
  const { transactions, fetchTransactions, isLoading } = useDataStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setError(null);
      await fetchTransactions({ limit: 100 });
    } catch (err) {
      setError('Impossible de charger les transactions');
      console.error('Failed to load transactions:', err);
    }
  };

  // Filtrer les transactions
  const filteredTransactions = transactions.filter((transaction) => {
    // Filtre par recherche
    const matchesSearch =
      searchQuery === '' ||
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.merchantName?.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtre par type
    let matchesFilter = true;
    if (selectedFilter === 'income') {
      matchesFilter = transaction.amount > 0;
    } else if (selectedFilter === 'expense') {
      matchesFilter = transaction.amount < 0;
    } else if (selectedFilter === 'pending') {
      matchesFilter = transaction.status === 'PENDING';
    }

    return matchesSearch && matchesFilter;
  });

  const handleTransactionPress = (transaction: Transaction) => {
    // TODO: Naviguer vers les détails de la transaction
    console.log('Transaction pressed:', transaction.id);
  };

  const handleAddTransaction = () => {
    navigation.navigate('AddTransaction');
  };

  if (error && !isLoading && transactions.length === 0) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={loadTransactions} fullScreen />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Rechercher une transaction..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FilterChip
          label="Tout"
          selected={selectedFilter === 'all'}
          onPress={() => setSelectedFilter('all')}
        />
        <FilterChip
          label="Revenus"
          selected={selectedFilter === 'income'}
          onPress={() => setSelectedFilter('income')}
        />
        <FilterChip
          label="Dépenses"
          selected={selectedFilter === 'expense'}
          onPress={() => setSelectedFilter('expense')}
        />
        <FilterChip
          label="En attente"
          selected={selectedFilter === 'pending'}
          onPress={() => setSelectedFilter('pending')}
        />
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Transactions List */}
      {isLoading && filteredTransactions.length === 0 ? (
        <LoadingSpinner message="Chargement des transactions..." />
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📭</Text>
          <Text style={styles.emptyStateTitle}>Aucune transaction</Text>
          <Text style={styles.emptyStateText}>
            {searchQuery || selectedFilter !== 'all'
              ? 'Aucun résultat pour ces filtres'
              : 'Commencez par ajouter votre première transaction'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionItem transaction={item} onPress={handleTransactionPress} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadTransactions} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.neutral.white,
  },
  searchInput: {
    marginBottom: 0,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  summary: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral[50],
  },
  summaryText: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});
