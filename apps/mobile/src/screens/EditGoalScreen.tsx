/**
 * Edit Goal Screen - Modal for editing an existing financial goal
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
import { CalendarDays } from 'lucide-react-native';
import { Button, Input, LoadingSpinner, FilterChip } from '@presentation/components/common';
import { colors } from '@shared/constants/colors';
import { spacing } from '@shared/constants/spacing';
import { typography } from '@shared/constants/typography';
import { apiClient } from '../lib/api';
import { useDataStore } from '../store';
import { GoalStatus } from '@finopt/shared';

type Priority = 1 | 2 | 3;

const PRIORITY_OPTIONS = [
  { value: 1 as Priority, label: 'Haute \u{1F525}', color: colors.status.error },
  { value: 2 as Priority, label: 'Moyenne \u26A1', color: colors.status.warning },
  { value: 3 as Priority, label: 'Basse \u{1F4A4}', color: colors.status.info },
];

const STATUS_OPTIONS = [
  { value: GoalStatus.ACTIVE, label: 'Actif' },
  { value: GoalStatus.PAUSED, label: 'En pause' },
  { value: GoalStatus.COMPLETED, label: 'Terminé' },
  { value: GoalStatus.CANCELLED, label: 'Annulé' },
];

export default function EditGoalScreen({ navigation, route }: any) {
  const { goal } = route.params;
  const { fetchGoals } = useDataStore();

  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description || '');
  const [targetAmount, setTargetAmount] = useState(String(goal.targetAmount));
  const [currentAmount, setCurrentAmount] = useState(String(goal.currentAmount));
  const [targetDateObj, setTargetDateObj] = useState<Date>(new Date(goal.targetDate));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState<Priority>(goal.priority as Priority);
  const [status, setStatus] = useState<GoalStatus>(goal.status);
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

    setIsLoading(true);
    setError(null);

    try {
      const updateData = {
        title,
        description: description || undefined,
        target_amount: parseFloat(targetAmount),
        current_amount: currentAmountValue,
        target_date: formatApiDate(targetDateObj),
        priority,
        status,
      };

      await apiClient.updateGoal(goal.id, updateData);
      await fetchGoals();

      Alert.alert(
        'Succès',
        'Objectif mis à jour!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message || 'Erreur inconnue';
      setError(typeof detail === 'string' ? detail.substring(0, 200) : JSON.stringify(detail));
      Alert.alert('Erreur', typeof detail === 'string' ? detail.substring(0, 500) : JSON.stringify(detail));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer l\'objectif',
      `Voulez-vous vraiment supprimer "${goal.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await apiClient.deleteGoal(goal.id);
              await fetchGoals();
              navigation.goBack();
            } catch (err: any) {
              const detail = err.response?.data?.detail || err.message || 'Erreur';
              Alert.alert('Erreur', typeof detail === 'string' ? detail : JSON.stringify(detail));
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Mise à jour..." />;
  }

  // Calculer le nombre de jours restants
  const calculateDaysRemaining = (): number | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = targetDateObj.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateMonthlySaving = (): number | null => {
    if (!targetAmount) return null;
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;
    const remaining = target - current;
    if (remaining <= 0) return null;
    const daysRemaining = calculateDaysRemaining();
    if (!daysRemaining || daysRemaining <= 0) return null;
    const monthsRemaining = daysRemaining / 30;
    return remaining / monthsRemaining;
  };

  const daysRemaining = calculateDaysRemaining();
  const monthlySaving = calculateMonthlySaving();
  const progressPercent = parseFloat(targetAmount) > 0
    ? ((parseFloat(currentAmount) / parseFloat(targetAmount)) * 100)
    : 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Modifier Objectif</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteButton}>Supprimer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Progression */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Progression</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(progressPercent, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressPercent.toFixed(1)}%</Text>
        </View>

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
            label="Montant épargné"
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
            <Text style={styles.datePickerText}>
              {formatDisplayDate(targetDateObj)}
            </Text>
            <CalendarDays size={20} color={colors.neutral[500]} />
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            date={targetDateObj}
            onConfirm={handleDateConfirm}
            onCancel={() => setShowDatePicker(false)}
            confirmTextIOS="Valider"
            cancelTextIOS="Annuler"
          />
        </View>

        {/* Priorité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priorité</Text>
          <View style={styles.chipContainer}>
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

        {/* Statut */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statut</Text>
          <View style={styles.chipContainer}>
            {STATUS_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                selected={status === option.value}
                onPress={() => setStatus(option.value)}
              />
            ))}
          </View>
        </View>

        {/* Recommandations */}
        {targetAmount && daysRemaining !== null && daysRemaining > 0 && (
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>{'\u{1F4A1}'} Recommandations</Text>
            <View style={styles.recommendationRow}>
              <Text style={styles.recommendationLabel}>Jours restants:</Text>
              <Text style={styles.recommendationValue}>{daysRemaining} jours</Text>
            </View>
            {monthlySaving !== null && monthlySaving > 0 && (
              <View style={styles.recommendationRow}>
                <Text style={styles.recommendationLabel}>Épargne mensuelle:</Text>
                <Text style={[styles.recommendationValue, { color: colors.primary.main, fontWeight: '600' }]}>
                  {monthlySaving.toFixed(2)} €/mois
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
            title="Enregistrer"
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
  deleteButton: {
    fontSize: typography.body.regular.fontSize,
    color: colors.status.error,
    fontWeight: '600',
  },
  title: {
    fontSize: typography.heading.h3.fontSize,
    fontWeight: typography.heading.h3.fontWeight,
    color: colors.neutral[800],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  progressCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
  },
  progressBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: colors.neutral[200],
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 6,
  },
  progressText: {
    fontSize: typography.body.small.fontSize,
    fontWeight: '600',
    color: colors.primary.main,
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
  chipContainer: {
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
  recommendationCard: {
    backgroundColor: colors.primary.light + '20',
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  recommendationTitle: {
    fontSize: typography.body.regular.fontSize,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
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
