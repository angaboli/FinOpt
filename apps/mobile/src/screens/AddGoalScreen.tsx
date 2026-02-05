/**
 * Add Goal Screen - Modal for creating a new financial goal
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
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { CalendarDays, Lightbulb } from 'lucide-react-native';
import { Button, Input, LoadingSpinner, FilterChip } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { apiClient } from '../lib/api';
import { useDataStore } from '../store';

type Priority = 1 | 2 | 3;

const PRIORITY_OPTIONS = [
  { value: 1 as Priority, label: 'Haute', color: colors.status.error },
  { value: 2 as Priority, label: 'Moyenne', color: colors.status.warning },
  { value: 3 as Priority, label: 'Basse', color: colors.status.info },
];

export default function AddGoalScreen({ navigation }: any) {
  const { fetchGoals } = useDataStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDateObj, setTargetDateObj] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState<Priority>(2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDisplayDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  const formatApiDate = (d: Date) => d.toISOString().split('T')[0];

  const handleDateConfirm = (date: Date) => {
    setTargetDateObj(date);
    setShowDatePicker(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      setError('Veuillez entrer un titre');
      return;
    }

    if (!targetAmount || isNaN(parseFloat(targetAmount)) || parseFloat(targetAmount) <= 0) {
      setError('Veuillez entrer un montant cible valide');
      return;
    }

    const currentAmountValue = parseFloat(currentAmount);
    if (isNaN(currentAmountValue) || currentAmountValue < 0) {
      setError('Le montant actuel doit être positif');
      return;
    }

    if (!targetDateObj) {
      setError('Veuillez sélectionner une date cible');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const goalData = {
        title,
        description: description || undefined,
        target_amount: parseFloat(targetAmount),
        target_date: formatApiDate(targetDateObj),
        priority,
      };

      console.log('🎯 Création de l\'objectif:', goalData);

      const createdGoal = await apiClient.createGoal(goalData);

      // Si l'utilisateur a entré un montant initial, faire une mise à jour
      if (currentAmountValue > 0) {
        console.log('💰 Mise à jour du montant initial:', currentAmountValue);
        await apiClient.updateGoal(createdGoal.id, { current_amount: currentAmountValue });
      }

      console.log('✅ Objectif créé avec succès!');

      // Rafraîchir les objectifs
      await fetchGoals();

      // Afficher un message de succès
      Alert.alert(
        'Succès',
        'Objectif créé avec succès!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message || 'Erreur inconnue';
      console.error('❌ Erreur création objectif:', detail);
      setError(typeof detail === 'string' ? detail.substring(0, 200) : JSON.stringify(detail));
      Alert.alert('Erreur', typeof detail === 'string' ? detail.substring(0, 500) : JSON.stringify(detail));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Création de l'objectif..." />;
  }

  // Calculer le nombre de jours restants
  const calculateDaysRemaining = (): number | null => {
    if (!targetDateObj) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = targetDateObj.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Calculer l'épargne mensuelle recommandée
  const calculateMonthlySaving = (): number | null => {
    if (!targetAmount || !targetDateObj) return null;
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;
    const remaining = target - current;
    const daysRemaining = calculateDaysRemaining();
    if (!daysRemaining || daysRemaining <= 0) return null;
    const monthsRemaining = daysRemaining / 30;
    return remaining / monthsRemaining;
  };

  const daysRemaining = calculateDaysRemaining();
  const monthlySaving = calculateMonthlySaving();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nouvel Objectif</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Titre */}
        <View style={styles.section}>
          <Input
            label="Titre *"
            placeholder="Ex: Vacances d'été, Nouvelle voiture..."
            value={title}
            onChangeText={setTitle}
            autoCapitalize="sentences"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Input
            label="Description"
            placeholder="Décrivez votre objectif..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
          />
        </View>

        {/* Montant cible */}
        <View style={styles.section}>
          <Input
            label="Montant cible *"
            placeholder="0.00"
            value={targetAmount}
            onChangeText={setTargetAmount}
            keyboardType="decimal-pad"
            rightIcon={<Text style={styles.currencySymbol}>€</Text>}
          />
        </View>

        {/* Montant actuel */}
        <View style={styles.section}>
          <Input
            label="Montant déjà épargné"
            placeholder="0.00"
            value={currentAmount}
            onChangeText={setCurrentAmount}
            keyboardType="decimal-pad"
            rightIcon={<Text style={styles.currencySymbol}>€</Text>}
          />
        </View>

        {/* Date cible */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date cible *</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={targetDateObj ? styles.datePickerText : styles.datePickerPlaceholder}>
              {targetDateObj ? formatDisplayDate(targetDateObj) : 'Sélectionner une date'}
            </Text>
            <CalendarDays size={20} color={colors.neutral[500]} />
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            date={targetDateObj || new Date()}
            minimumDate={new Date()}
            onConfirm={handleDateConfirm}
            onCancel={() => setShowDatePicker(false)}
            confirmTextIOS="Valider"
            cancelTextIOS="Annuler"
          />
        </View>

        {/* Priorité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priorité</Text>
          <View style={styles.priorityContainer}>
            {PRIORITY_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                selected={priority === option.value}
                onPress={() => setPriority(option.value)}
              />
            ))}
          </View>
        </View>

        {/* Preview / Recommandations */}
        {targetAmount && targetDateObj && (
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationTitleRow}>
              <Lightbulb size={18} color={colors.neutral[800]} />
              <Text style={styles.recommendationTitle}>Recommandations</Text>
            </View>

            {daysRemaining !== null && (
              <View style={styles.recommendationRow}>
                <Text style={styles.recommendationLabel}>Jours restants:</Text>
                <Text style={styles.recommendationValue}>
                  {daysRemaining > 0 ? `${daysRemaining} jours` : 'Date dépassée'}
                </Text>
              </View>
            )}

            {monthlySaving !== null && monthlySaving > 0 && (
              <View style={styles.recommendationRow}>
                <Text style={styles.recommendationLabel}>Épargne mensuelle:</Text>
                <Text style={[styles.recommendationValue, { color: colors.primary.main, fontWeight: '600' }]}>
                  {monthlySaving.toFixed(2)} €/mois
                </Text>
              </View>
            )}

            {parseFloat(targetAmount) > 0 && parseFloat(currentAmount) > 0 && (
              <View style={styles.recommendationRow}>
                <Text style={styles.recommendationLabel}>Progression initiale:</Text>
                <Text style={styles.recommendationValue}>
                  {((parseFloat(currentAmount) / parseFloat(targetAmount)) * 100).toFixed(1)}%
                </Text>
              </View>
            )}
          </View>
        )}

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
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  datePickerPlaceholder: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[400],
  },
  recommendationCard: {
    backgroundColor: colors.primary.light + '20',
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  recommendationTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  recommendationTitle: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  recommendationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  recommendationLabel: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[700],
  },
  recommendationValue: {
    fontSize: typography.body.regular.fontSize,
    color: colors.neutral[800],
    fontWeight: '500',
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
