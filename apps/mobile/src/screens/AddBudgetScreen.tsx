/**
 * Add Budget Screen - Modal for creating a new budget
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

// Catégories prédéfinies (à remplacer par un appel API plus tard)
const CATEGORIES = [
  { id: '1', name: 'Alimentation', icon: '🍔' },
  { id: '2', name: 'Transport', icon: '🚗' },
  { id: '3', name: 'Loisirs', icon: '🎬' },
  { id: '4', name: 'Santé', icon: '💊' },
  { id: '5', name: 'Logement', icon: '🏠' },
];

export default function AddBudgetScreen({ navigation }: any) {
  const { fetchBudgets } = useDataStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('1');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validation
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Veuillez entrer un montant valide');
      return;
    }

    if (!selectedCategory) {
      setError('Veuillez sélectionner une catégorie');
      return;
    }

    const thresholdValue = parseFloat(alertThreshold);
    if (isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) {
      setError('Le seuil d\'alerte doit être entre 0 et 100');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Calculer les dates de période selon le type (mensuel ou hebdomadaire)
      const now = new Date();
      let periodStart: string;
      let periodEnd: string;

      if (period === 'MONTHLY') {
        // Début et fin du mois en cours
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      } else {
        // Semaine en cours (Lundi-Dimanche)
        const dayOfWeek = now.getDay() || 7; // Dimanche = 0 → 7
        const monday = new Date(now);
        monday.setDate(now.getDate() - dayOfWeek + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        periodStart = monday.toISOString().split('T')[0];
        periodEnd = sunday.toISOString().split('T')[0];
      }

      const budgetData = {
        categoryId: selectedCategory,
        amount: parseFloat(amount),
        periodStart,
        periodEnd,
        warningThreshold: thresholdValue,
        criticalThreshold: 100, // 100% = dépassé
      };

      console.log('💰 Création du budget:', budgetData);

      await apiClient.createBudget(budgetData);

      console.log('✅ Budget créé avec succès!');

      // Rafraîchir les budgets
      await fetchBudgets();

      // Afficher un message de succès
      Alert.alert(
        'Succès',
        'Budget créé avec succès!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      console.error('❌ Erreur création budget:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors de la création du budget');
      Alert.alert('Erreur', err.response?.data?.message || err.message || 'Erreur lors de la création du budget');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Création du budget..." />;
  }

  const selectedCat = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nouveau Budget</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Catégorie */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégorie *</Text>
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((category) => (
              <FilterChip
                key={category.id}
                label={`${category.icon} ${category.name}`}
                selected={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
              />
            ))}
          </View>
        </View>

        {/* Montant */}
        <View style={styles.section}>
          <Input
            label="Montant du budget *"
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            rightIcon={<Text style={styles.currencySymbol}>€</Text>}
          />
        </View>

        {/* Période */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Période</Text>
          <View style={styles.periodContainer}>
            <FilterChip
              label="📅 Mensuel"
              selected={period === 'MONTHLY'}
              onPress={() => setPeriod('MONTHLY')}
            />
            <FilterChip
              label="📆 Hebdomadaire"
              selected={period === 'WEEKLY'}
              onPress={() => setPeriod('WEEKLY')}
            />
          </View>
        </View>

        {/* Seuil d'alerte */}
        <View style={styles.section}>
          <Input
            label="Seuil d'alerte (%)"
            placeholder="80"
            value={alertThreshold}
            onChangeText={setAlertThreshold}
            keyboardType="decimal-pad"
            rightIcon={<Text style={styles.currencySymbol}>%</Text>}
            helperText="Vous serez alerté lorsque vous atteignez ce pourcentage"
          />
        </View>

        {/* Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Aperçu</Text>
          <View style={styles.previewContent}>
            <Text style={styles.previewIcon}>{selectedCat?.icon || '📊'}</Text>
            <View style={styles.previewInfo}>
              <Text style={styles.previewCategory}>{selectedCat?.name || 'Catégorie'}</Text>
              <Text style={styles.previewAmount}>
                {amount ? `${parseFloat(amount).toFixed(2)} €` : '0.00 €'} / {period === 'MONTHLY' ? 'mois' : 'semaine'}
              </Text>
              <Text style={styles.previewAlert}>
                Alerte à {alertThreshold || 80}% ({amount ? ((parseFloat(amount) * parseFloat(alertThreshold || '80')) / 100).toFixed(2) : '0.00'} €)
              </Text>
            </View>
          </View>
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
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  periodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  currencySymbol: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previewTitle: {
    fontSize: typography.body.small.fontSize,
    fontWeight: '600',
    color: colors.neutral[600],
    marginBottom: spacing.sm,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  previewInfo: {
    flex: 1,
  },
  previewCategory: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  previewAmount: {
    fontSize: typography.body.regular.fontSize,
    color: colors.primary.main,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  previewAlert: {
    fontSize: typography.body.small.fontSize,
    color: colors.neutral[600],
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
