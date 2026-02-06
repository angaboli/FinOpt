/**
 * Add Transaction Screen - Modal for adding a new transaction
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { CalendarDays } from 'lucide-react-native';
import { Button, Input, LoadingSpinner, FilterChip } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { apiClient } from '../lib/api';
import { useDataStore } from '../store';
import { AccountType, OwnerScope } from '@finopt/shared';

type TransactionType = 'expense' | 'income';

export default function AddTransactionScreen({ navigation, route }: any) {
  const editTransaction = route?.params?.transaction;
  const isEdit = route?.params?.isEdit === true;

  const { accounts, categories, fetchTransactions, fetchAccounts, fetchCategories } = useDataStore();
  const [type, setType] = useState<TransactionType>(
    isEdit && editTransaction ? (Number(editTransaction.amount) >= 0 ? 'income' : 'expense') : 'expense'
  );
  const [amount, setAmount] = useState(
    isEdit && editTransaction ? String(Math.abs(Number(editTransaction.amount))) : ''
  );
  const [description, setDescription] = useState(
    isEdit && editTransaction ? editTransaction.description || '' : ''
  );
  const [merchantName, setMerchantName] = useState(
    isEdit && editTransaction ? editTransaction.merchantName || '' : ''
  );
  const [dateObj, setDateObj] = useState(
    isEdit && editTransaction ? new Date(editTransaction.date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState(
    isEdit && editTransaction ? editTransaction.notes || '' : ''
  );

  const formatDisplayDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  const formatApiDate = (d: Date) => d.toISOString().split('T')[0];

  const handleDateConfirm = (date: Date) => {
    setDateObj(date);
    setShowDatePicker(false);
  };
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    isEdit && editTransaction ? editTransaction.accountId : (accounts.length > 0 ? accounts[0].id : null)
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    isEdit && editTransaction ? editTransaction.categoryId || null : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, []);

  // Mettre à jour le compte sélectionné quand les comptes changent
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts]);

  const handleSubmit = async () => {
    // Validation
    if (!amount || isNaN(parseFloat(amount))) {
      setError('Veuillez entrer un montant valide');
      return;
    }

    if (!description.trim()) {
      setError('Veuillez entrer une description');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const amountValue = type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));

      // Utiliser le compte sélectionné ou créer un compte par défaut
      let accountId = selectedAccountId;

      // Si pas de compte, en créer un par défaut
      if (!accountId) {
        const newAccount = await apiClient.createAccount({
          name: 'Compte Principal',
          type: AccountType.CHECKING,
          owner_scope: OwnerScope.PERSONAL,
          currency: 'EUR',
        });
        accountId = newAccount.id;
        setSelectedAccountId(accountId);
        // Rafraîchir la liste des comptes
        await fetchAccounts();
      }

      if (isEdit && editTransaction) {
        await apiClient.updateTransaction(editTransaction.id, {
          account_id: accountId!,
          amount: amountValue,
          description,
          category_id: selectedCategoryId || undefined,
          merchant_name: merchantName || undefined,
          date: formatApiDate(dateObj),
          notes: notes || undefined,
        });
      } else {
        await apiClient.createTransaction({
          account_id: accountId!,
          amount: amountValue,
          description,
          category_id: selectedCategoryId || undefined,
          merchant_name: merchantName || undefined,
          date: formatApiDate(dateObj),
          notes: notes || undefined,
        });
      }

      // Rafraîchir les transactions
      await fetchTransactions({ limit: 100 });

      // Afficher un message de succès
      Alert.alert(
        'Succès',
        isEdit ? 'Transaction modifiée avec succès!' : 'Transaction créée avec succès!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Erreur lors de la création';
      setError(msg);
      Alert.alert('Erreur', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message={isEdit ? "Modification en cours..." : "Création de la transaction..."} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? 'Modifier' : 'Nouvelle Transaction'}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Type de transaction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type</Text>
          <View style={styles.typeContainer}>
            <FilterChip
              label="Depense"
              selected={type === 'expense'}
              onPress={() => setType('expense')}
            />
            <FilterChip
              label="Revenu"
              selected={type === 'income'}
              onPress={() => setType('income')}
            />
          </View>
        </View>

        {/* Sélection du compte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte *</Text>
          {accounts.length > 0 ? (
            <View style={styles.accountSelector}>
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountOption,
                    selectedAccountId === account.id && styles.accountOptionSelected,
                  ]}
                  onPress={() => setSelectedAccountId(account.id)}
                >
                  <View style={styles.accountOptionContent}>
                    <Text style={[
                      styles.accountOptionText,
                      selectedAccountId === account.id && styles.accountOptionTextSelected,
                    ]}>
                      {account.name}
                    </Text>
                    <Text style={[
                      styles.accountOptionBalance,
                      selectedAccountId === account.id && styles.accountOptionBalanceSelected,
                    ]}>
                      {account.balance.toFixed(2)} {account.currency}
                    </Text>
                  </View>
                  {selectedAccountId === account.id && (
                    <Text style={styles.accountCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noAccountContainer}>
              <Text style={styles.noAccountText}>
                Aucun compte disponible. Un compte sera créé automatiquement.
              </Text>
            </View>
          )}
        </View>

        {/* Montant */}
        <View style={styles.section}>
          <Input
            label="Montant *"
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            rightIcon={<Text style={styles.currencySymbol}>€</Text>}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Input
            label="Description *"
            placeholder="Ex: Courses, Salaire, ..."
            value={description}
            onChangeText={setDescription}
            autoCapitalize="sentences"
          />
        </View>

        {/* Catégorie */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catégorie</Text>
            <View style={styles.typeContainer}>
              {categories.map((cat) => (
                <FilterChip
                  key={cat.id}
                  label={cat.name}
                  selected={selectedCategoryId === cat.id}
                  onPress={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Marchand */}
        <View style={styles.section}>
          <Input
            label="Marchand / Bénéficiaire"
            placeholder="Ex: Carrefour, Employeur, ..."
            value={merchantName}
            onChangeText={setMerchantName}
            autoCapitalize="words"
          />
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.datePickerText}>
              {formatDisplayDate(dateObj)}
            </Text>
            <CalendarDays size={20} color={colors.neutral[500]} />
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            date={dateObj}
            onConfirm={handleDateConfirm}
            onCancel={() => setShowDatePicker(false)}
            confirmTextIOS="Valider"
            cancelTextIOS="Annuler"
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Input
            label="Notes"
            placeholder="Notes additionnelles..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Erreur */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Boutons */}
        <View style={styles.actions}>
          <Button
            title="Annuler"
            variant="outline"
            onPress={handleCancel}
            style={styles.actionButton}
          />
          <Button
            title={isEdit ? "Enregistrer" : "Ajouter"}
            variant="primary"
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  cancelButton: {
    fontSize: typography.body.regular.fontSize,
    color: colors.primary.main,
    fontWeight: '600',
  },
  title: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
  },
  placeholder: {
    width: 60, // Pour équilibrer avec le bouton Annuler
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  accountSelector: {
    gap: spacing.sm,
  },
  accountOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[200],
  },
  accountOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  accountOptionContent: {
    flex: 1,
  },
  accountOptionText: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  accountOptionTextSelected: {
    color: colors.primary.main,
  },
  accountOptionBalance: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
  },
  accountOptionBalanceSelected: {
    color: colors.primary.dark,
  },
  accountCheckmark: {
    fontSize: 20,
    color: colors.primary.main,
    marginLeft: spacing.sm,
  },
  noAccountContainer: {
    padding: spacing.md,
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  noAccountText: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  currencySymbol: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  datePickerText: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[800],
  },
  errorContainer: {
    backgroundColor: colors.status.errorLight,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.body.regular.fontSize,
    color: colors.status.error,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});
