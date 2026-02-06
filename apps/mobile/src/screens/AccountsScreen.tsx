/**
 * Accounts Screen - Liste et gestion des comptes bancaires
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { CreditCard, Wallet, TrendingUp, Building2 } from 'lucide-react-native';
import { Card, LoadingSpinner, Button } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { useDataStore } from '../store';
import { apiClient } from '../lib/api';
import type { Account } from '@finopt/shared';

export default function AccountsScreen({ navigation }: any) {
  const { accounts, fetchAccounts, isLoading } = useDataStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAccounts();
    setRefreshing(false);
  };

  const handleAddAccount = () => {
    navigation.navigate('AddAccount');
  };

  const handleAccountPress = (account: Account) => {
    Alert.alert(
      account.name,
      `Solde: ${account.balance.toFixed(2)} ${account.currency}\nType: ${account.type}\nStatut: ${account.isActive ? 'Actif' : 'Inactif'}`,
      [
        { text: 'OK' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => handleDeleteAccount(account),
        },
      ]
    );
  };

  const handleDeleteAccount = async (account: Account) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer "${account.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteAccount(account.id);
              await fetchAccounts();
              Alert.alert('Succès', 'Compte supprimé avec succès');
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const getAccountIcon = (type: string) => {
    const iconProps = { size: 28, color: colors.primary.main };
    switch (type) {
      case 'CHECKING':
        return <CreditCard {...iconProps} />;
      case 'SAVINGS':
        return <Wallet {...iconProps} />;
      case 'INVESTMENT':
        return <TrendingUp {...iconProps} />;
      case 'CREDIT_CARD':
        return <CreditCard {...iconProps} />;
      default:
        return <Building2 {...iconProps} />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'CHECKING':
        return 'Compte Courant';
      case 'SAVINGS':
        return 'Compte Épargne';
      case 'INVESTMENT':
        return 'Compte Investissement';
      case 'CREDIT_CARD':
        return 'Carte de Crédit';
      default:
        return type;
    }
  };

  const calculateTotalBalance = () => {
    return accounts.reduce((total, account) => {
      if (account.isActive) {
        return total + account.balance;
      }
      return total;
    }, 0);
  };

  if (isLoading && accounts.length === 0) {
    return <LoadingSpinner fullScreen message="Chargement des comptes..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes Comptes</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddAccount}>
          <Text style={styles.addButtonText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      {/* Total Balance Card */}
      <Card style={[styles.totalCard, calculateTotalBalance() < 0 && styles.totalCardNegative]}>
        <Text style={styles.totalLabel}>Solde Total</Text>
        <Text style={styles.totalAmount}>
          {calculateTotalBalance().toFixed(2)} EUR
        </Text>
        <Text style={styles.totalSubtext}>
          {accounts.filter((a) => a.isActive).length} compte(s) actif(s)
        </Text>
      </Card>

      {/* Accounts List */}
      <ScrollView
        style={styles.accountsList}
        contentContainerStyle={styles.accountsListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}><Building2 size={64} color={colors.neutral[400]} /></View>
            <Text style={styles.emptyStateTitle}>Aucun compte</Text>
            <Text style={styles.emptyStateText}>
              Commencez par créer votre premier compte bancaire
            </Text>
            <Button
              title="Créer un compte"
              onPress={handleAddAccount}
              style={styles.emptyStateButton}
            />
          </View>
        ) : (
          accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              onPress={() => handleAccountPress(account)}
              activeOpacity={0.7}
            >
              <Card style={styles.accountCard}>
                <View style={styles.accountCardHeader}>
                  <View style={styles.accountCardLeft}>
                    <View style={styles.accountIcon}>
                      {getAccountIcon(account.type)}
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Text style={styles.accountType}>
                        {getAccountTypeLabel(account.type)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.accountCardRight}>
                    <Text
                      style={[
                        styles.accountBalance,
                        account.balance < 0 && styles.accountBalanceNegative,
                      ]}
                    >
                      {account.balance.toFixed(2)}
                    </Text>
                    <Text style={styles.accountCurrency}>{account.currency}</Text>
                  </View>
                </View>
                {account.bankName && (
                  <View style={styles.accountCardFooter}>
                    <View style={styles.accountBankRow}>
                      <Building2 size={14} color={colors.neutral[600]} />
                      <Text style={styles.accountBank}>{account.bankName}</Text>
                    </View>
                    {account.ibanLast4 && (
                      <Text style={styles.accountIban}>•••• {account.ibanLast4}</Text>
                    )}
                  </View>
                )}
                {!account.isActive && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>Inactif</Text>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))
        )}
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
  totalCard: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
  },
  totalCardNegative: {
    backgroundColor: colors.status.error,
  },
  totalLabel: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral.white,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.neutral.white,
    marginBottom: spacing.xs,
  },
  totalSubtext: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral.white,
    opacity: 0.8,
  },
  accountsList: {
    flex: 1,
  },
  accountsListContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  accountCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    position: 'relative',
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  accountCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.light,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.sm,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  accountType: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
  },
  accountCardRight: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: '700',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  accountBalanceNegative: {
    color: colors.status.error,
  },
  accountCurrency: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
  },
  accountCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  accountBankRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  accountBank: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
  },
  accountIban: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  inactiveBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.neutral[400],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    fontSize: typography.body.tiny.fontSize,
    color: colors.neutral.white,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 3,
  },
  emptyStateIcon: {
    marginBottom: spacing.md,
    alignItems: 'center' as const,
  },
  emptyStateTitle: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  emptyStateButton: {
    minWidth: 200,
  },
});
