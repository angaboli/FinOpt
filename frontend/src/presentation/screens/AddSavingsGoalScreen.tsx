import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { useNotificationsStore } from "@/application/notifications/notificationsStore";
import { useSavingsGoalsStore } from "@/application/savingsGoals/savingsGoalsStore";
import { scheduleSavingsGoalAlert } from "@/infrastructure/notifications/notificationService";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "AddSavingsGoal">;

export function AddSavingsGoalScreen({ navigation, route }: Props) {
  const { goalId } = route.params ?? {};
  const goals = useSavingsGoalsStore((s) => s.goals);
  const isLoading = useSavingsGoalsStore((s) => s.isLoading);
  const createGoal = useSavingsGoalsStore((s) => s.createGoal);
  const updateGoal = useSavingsGoalsStore((s) => s.updateGoal);

  const existing = goalId ? goals.find((g) => g.id === goalId) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(existing ? String(existing.targetAmount) : "");
  const [currentAmount, setCurrentAmount] = useState(existing ? String(existing.currentAmount) : "0");
  const [deadline, setDeadline] = useState(existing?.deadline ?? "");

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setTargetAmount(String(existing.targetAmount));
      setCurrentAmount(String(existing.currentAmount));
      setDeadline(existing.deadline ?? "");
    }
  }, [existing]);

  const parsedTarget = Number(targetAmount.replace(",", ".") || "0");
  const parsedCurrent = Number(currentAmount.replace(",", ".") || "0");
  const canSubmit =
    name.trim().length > 0 &&
    !Number.isNaN(parsedTarget) &&
    parsedTarget > 0 &&
    !Number.isNaN(parsedCurrent) &&
    parsedCurrent >= 0;

  const deadlineValue = deadline.trim() || null;

  async function handleSave() {
    if (!canSubmit) return;
    let result;
    if (existing) {
      result = await updateGoal(existing.id, name, parsedTarget, parsedCurrent, deadlineValue);
    } else {
      result = await createGoal(name, parsedTarget, parsedCurrent, deadlineValue);
    }
    if (result.progressRatio >= 0.5) {
      const pct = Math.round(result.progressRatio * 100);
      const milestone = result.progressRatio >= 1 ? "atteint !" : `à ${pct}%`;
      useNotificationsStore.getState().addNotification(
        "Objectif d'épargne",
        `"${name}" est maintenant ${milestone}`,
      );
      void scheduleSavingsGoalAlert(name, result.progressRatio);
    }
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{existing ? "Modifier l'objectif" : "Nouvel objectif"}</Text>
      <Text style={styles.subtitle}>
        {existing ? "Mettez à jour votre objectif d'épargne." : "Définissez un objectif d'épargne à atteindre."}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nom de l'objectif</Text>
        <TextInput
          accessibilityLabel="Nom de l'objectif"
          onChangeText={setName}
          placeholder="Vacances, Voiture, Retraite..."
          placeholderTextColor={finoptTheme.colors.gray500}
          style={styles.input}
          value={name}
        />

        <Text style={styles.label}>Montant cible (€)</Text>
        <TextInput
          accessibilityLabel="Montant cible"
          keyboardType="decimal-pad"
          onChangeText={setTargetAmount}
          placeholder="5000"
          placeholderTextColor={finoptTheme.colors.gray500}
          style={styles.input}
          value={targetAmount}
        />

        <Text style={styles.label}>Montant déjà épargné (€)</Text>
        <TextInput
          accessibilityLabel="Montant épargné"
          keyboardType="decimal-pad"
          onChangeText={setCurrentAmount}
          placeholder="0"
          placeholderTextColor={finoptTheme.colors.gray500}
          style={styles.input}
          value={currentAmount}
        />

        <Text style={styles.label}>Échéance (optionnel, format AAAA-MM-JJ)</Text>
        <TextInput
          accessibilityLabel="Échéance"
          onChangeText={setDeadline}
          placeholder="2025-12-31"
          placeholderTextColor={finoptTheme.colors.gray500}
          style={styles.input}
          value={deadline}
        />
      </View>

      <Pressable
        accessibilityLabel={existing ? "Mettre à jour l'objectif" : "Créer l'objectif"}
        accessibilityRole="button"
        disabled={!canSubmit || isLoading}
        onPress={handleSave}
        style={[styles.button, (!canSubmit || isLoading) && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Enregistrement..." : existing ? "Mettre à jour" : "Créer l'objectif"}
        </Text>
      </Pressable>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: finoptTheme.colors.background,
    flexGrow: 1,
    gap: finoptTheme.spacing.lg,
    padding: finoptTheme.spacing.xl,
    paddingBottom: finoptTheme.spacing.xxl,
  },
  title: { color: finoptTheme.colors.foreground, fontSize: 30, fontWeight: "800" },
  subtitle: { color: finoptTheme.colors.gray600, lineHeight: 21 },
  card: {
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1,
    gap: finoptTheme.spacing.md,
    padding: finoptTheme.spacing.lg,
    ...finoptTheme.shadow.card,
  },
  label: { color: finoptTheme.colors.foreground, fontWeight: "800" },
  input: {
    backgroundColor: finoptTheme.colors.muted,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.sm,
    borderWidth: 1,
    color: finoptTheme.colors.foreground,
    minHeight: 48,
    paddingHorizontal: finoptTheme.spacing.md,
  },
  button: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.primary,
    borderRadius: finoptTheme.radius.lg,
    justifyContent: "center",
    minHeight: 54,
    ...finoptTheme.shadow.action,
  },
  buttonDisabled: { backgroundColor: finoptTheme.colors.gray400, elevation: 0, shadowOpacity: 0 },
  buttonText: { color: finoptTheme.colors.white, fontWeight: "800" },
});
