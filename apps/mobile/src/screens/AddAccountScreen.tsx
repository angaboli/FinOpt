/**
 * Add Account Screen - Modal pour créer un nouveau compte
 */

import React, { useState } from 'react';
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
import { Button, Input, LoadingSpinner, FilterChip } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { apiClient } from '../lib/api';
import { useDataStore } from '../store';
import { AccountType, OwnerScope } from '@finopt/shared';

export default function AddAccountScreen({ navigation }: any) {
  const { fetchAccounts } = useDataStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>(AccountType.CHECKING);
  const [ownerScope, setOwnerScope] = useState<OwnerScope>(OwnerScope.PERSONAL);
  const [currency, setCurrency] = useState('EUR');
  const [bankName, setBankName] = useState('');
  const [ibanLast4, setIbanLast4] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountTypes = [
    { value: AccountType.CHECKING, label: 'Compte Courant' },
    { value: AccountType.SAVINGS, label: 'Epargne' },
    { value: AccountType.INVESTMENT, label: 'Investissement' },
    { value: AccountType.CREDIT_CARD, label: 'Carte Credit' },
  ];

  const ownerScopes = [
    { value: OwnerScope.PERSONAL, label: 'Personnel' },
    { value: OwnerScope.JOINT, label: 'Joint' },
    { value: OwnerScope.BUSINESS, label: 'Professionnel' },
  ];

  const currencies = [
    { value: 'EUR', label: '€ EUR' },
    { value: 'USD', label: '$ USD' },
    { value: 'GBP', label: '£ GBP' },
    { value: 'CHF', label: 'CHF' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError('Veuillez entrer un nom de compte');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('📝 Création du compte:', {
        name,
        type,
        ownerScope,
        currency,
        bankName,
        ibanLast4,
      });

      await apiClient.createAccount({
        name: name.trim(),
        type,
        owner_scope: ownerScope,
        currency,
        bank_name: bankName.trim() || undefined,
        iban_last4: ibanLast4.trim() || undefined,
      });

      console.log('✅ Compte créé avec succès!');

      // Rafraîchir les comptes
      await fetchAccounts();

      // Afficher un message de succès
      Alert.alert(
        'Succès',
        'Compte créé avec succès!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      console.error('❌ Erreur création compte:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors de la création du compte');
      Alert.alert('Erreur', err.response?.data?.message || err.message || 'Erreur lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Création du compte..." />;
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
        <Text style={styles.title}>Nouveau Compte</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Nom du compte */}
        <View style={styles.section}>
          <Input
            label="Nom du compte *"
            placeholder="Ex: Compte Courant, Livret A..."
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Type de compte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de compte *</Text>
          <View style={styles.optionsContainer}>
            {accountTypes.map((item) => (
              <FilterChip
                key={item.value}
                label={item.label}
                selected={type === item.value}
                onPress={() => setType(item.value)}
              />
            ))}
          </View>
        </View>

        {/* Propriétaire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propriétaire *</Text>
          <View style={styles.optionsContainer}>
            {ownerScopes.map((item) => (
              <FilterChip
                key={item.value}
                label={item.label}
                selected={ownerScope === item.value}
                onPress={() => setOwnerScope(item.value)}
              />
            ))}
          </View>
        </View>

        {/* Devise */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Devise *</Text>
          <View style={styles.optionsContainer}>
            {currencies.map((item) => (
              <FilterChip
                key={item.value}
                label={item.label}
                selected={currency === item.value}
                onPress={() => setCurrency(item.value)}
              />
            ))}
          </View>
        </View>

        {/* Informations bancaires (optionnel) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations bancaires (optionnel)</Text>
          <Input
            label="Nom de la banque"
            placeholder="Ex: BNP Paribas, Crédit Agricole..."
            value={bankName}
            onChangeText={setBankName}
            autoCapitalize="words"
            style={styles.optionalInput}
          />
          <Input
            label="4 derniers chiffres IBAN"
            placeholder="Ex: 1234"
            value={ibanLast4}
            onChangeText={(text) => {
              // Limiter à 4 chiffres
              const cleaned = text.replace(/\D/g, '').slice(0, 4);
              setIbanLast4(cleaned);
            }}
            keyboardType="number-pad"
            maxLength={4}
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
            title="Créer"
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
    width: 60,
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
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionalInput: {
    marginBottom: spacing.sm,
  },
  errorContainer: {
    backgroundColor: colors.status.errorLight,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.status.error,
    fontSize: typography.body.regular.fontSize,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
