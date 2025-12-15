/**
 * Dashboard Screen - Overview of accounts and recent transactions
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useDataStore } from '../store';

export default function DashboardScreen() {
  const { accounts, transactions, fetchAccounts, fetchTransactions, isLoading } = useDataStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchAccounts();
    await fetchTransactions({ limit: 10 });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      {/* Total Balance */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Solde total</Text>
        <Text style={styles.balance}>
          {accounts.reduce((sum, acc) => sum + Number(acc.balance), 0).toFixed(2)}€
        </Text>
      </View>

      {/* Accounts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comptes ({accounts.length})</Text>
        {accounts.map((account) => (
          <View key={account.id} style={styles.accountItem}>
            <View>
              <Text style={styles.accountName}>{account.name}</Text>
              <Text style={styles.accountType}>{account.type}</Text>
            </View>
            <Text style={styles.accountBalance}>{Number(account.balance).toFixed(2)}€</Text>
          </View>
        ))}
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transactions récentes</Text>
        {transactions.slice(0, 5).map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View>
              <Text style={styles.transactionDesc}>{transaction.description}</Text>
              <Text style={styles.transactionDate}>
                {new Date(transaction.date).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <Text
              style={[
                styles.transactionAmount,
                Number(transaction.amount) < 0 ? styles.expense : styles.income,
              ]}
            >
              {Number(transaction.amount) > 0 ? '+' : ''}
              {Number(transaction.amount).toFixed(2)}€
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#3b82f6',
    margin: 16,
    padding: 24,
    borderRadius: 16,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 8,
  },
  balance: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountType: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  expense: {
    color: '#ef4444',
  },
  income: {
    color: '#10b981',
  },
});
