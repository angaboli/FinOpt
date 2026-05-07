import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { useSavingsGoalsStore } from "@/application/savingsGoals/savingsGoalsStore";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "SavingsGoals">;

const currency = new Intl.NumberFormat("fr-FR", { currency: "EUR", style: "currency" });

export function SavingsGoalsScreen({ navigation }: Props) {
  const goals = useSavingsGoalsStore((s) => s.goals);
  const isLoading = useSavingsGoalsStore((s) => s.isLoading);
  const error = useSavingsGoalsStore((s) => s.error);
  const loadGoals = useSavingsGoalsStore((s) => s.loadGoals);
  const deleteGoal = useSavingsGoalsStore((s) => s.deleteGoal);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  function confirmDelete(id: string, name: string) {
    Alert.alert("Supprimer", `Supprimer l'objectif "${name}" ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => void deleteGoal(id) },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>Objectifs d'épargne</Text>
          <Text style={styles.subtitle}>Suivez votre progression vers vos objectifs financiers.</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isLoading && goals.length === 0 ? (
          <Text style={styles.empty}>Chargement...</Text>
        ) : goals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucun objectif défini</Text>
            <Text style={styles.emptyText}>
              Créez votre premier objectif pour commencer à épargner.
            </Text>
          </View>
        ) : (
          goals.map((goal) => (
            <View key={goal.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{goal.name}</Text>
                <Pressable onPress={() => confirmDelete(goal.id, goal.name)}>
                  <Text style={styles.deleteBtn}>Supprimer</Text>
                </Pressable>
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>
                  {currency.format(goal.currentAmount)} / {currency.format(goal.targetAmount)}
                </Text>
                <Text style={styles.progressPct}>{Math.round(goal.progressRatio * 100)}%</Text>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${Math.round(goal.progressRatio * 100)}%` }]} />
              </View>
              {goal.remainingAmount > 0 && (
                <Text style={styles.remaining}>
                  Reste : {currency.format(goal.remainingAmount)}
                  {goal.deadline ? ` — échéance : ${goal.deadline}` : ""}
                </Text>
              )}
              <Pressable
                style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
                onPress={() => navigation.navigate("AddSavingsGoal", { goalId: goal.id })}
              >
                <Text style={styles.editBtnText}>Modifier</Text>
              </Pressable>
            </View>
          ))
        )}

        <Pressable
          accessibilityLabel="Ajouter un objectif d'épargne"
          accessibilityRole="button"
          onPress={() => navigation.navigate("AddSavingsGoal", {})}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Nouvel objectif</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Obtenir des conseils IA"
          accessibilityRole="button"
          onPress={() => navigation.navigate("BudgetAdvice")}
          style={({ pressed }) => [styles.adviceBtn, pressed && styles.adviceBtnPressed]}
        >
          <Text style={styles.adviceBtnText}>Conseils IA du mois</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: finoptTheme.colors.background, flex: 1 },
  content: { gap: finoptTheme.spacing.lg, padding: finoptTheme.spacing.xl, paddingBottom: finoptTheme.spacing.xxl },
  hero: { gap: finoptTheme.spacing.xs },
  title: { color: finoptTheme.colors.foreground, fontSize: 30, fontWeight: "800" },
  subtitle: { color: finoptTheme.colors.gray600, lineHeight: 21 },
  error: { color: finoptTheme.colors.danger, fontWeight: "700" },
  empty: { color: finoptTheme.colors.gray600, textAlign: "center" },
  emptyCard: {
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1,
    gap: finoptTheme.spacing.sm,
    padding: finoptTheme.spacing.lg,
  },
  emptyTitle: { color: finoptTheme.colors.foreground, fontWeight: "800" },
  emptyText: { color: finoptTheme.colors.gray600, lineHeight: 20 },
  card: {
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1,
    gap: finoptTheme.spacing.sm,
    padding: finoptTheme.spacing.lg,
  },
  cardHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  cardName: { color: finoptTheme.colors.foreground, fontWeight: "800", fontSize: 16 },
  deleteBtn: { color: finoptTheme.colors.danger, fontSize: 13 },
  progressRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { color: finoptTheme.colors.gray600, fontSize: 13 },
  progressPct: { color: finoptTheme.colors.primary, fontWeight: "700", fontSize: 13 },
  barBg: { backgroundColor: finoptTheme.colors.accent, borderRadius: 4, height: 8, overflow: "hidden" },
  barFill: { backgroundColor: finoptTheme.colors.primary, borderRadius: 4, height: 8 },
  remaining: { color: finoptTheme.colors.gray600, fontSize: 12 },
  editBtn: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.primaryLight,
    borderRadius: finoptTheme.radius.md,
    justifyContent: "center",
    paddingVertical: 8,
  },
  editBtnPressed: { opacity: 0.7 },
  editBtnText: { color: finoptTheme.colors.primary, fontWeight: "700" },
  button: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.primary,
    borderRadius: finoptTheme.radius.lg,
    justifyContent: "center",
    minHeight: 54,
    ...finoptTheme.shadow.action,
  },
  buttonPressed: { backgroundColor: finoptTheme.colors.primaryDark },
  buttonText: { color: finoptTheme.colors.white, fontWeight: "800" },
  adviceBtn: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.primary,
    borderRadius: finoptTheme.radius.lg,
    borderWidth: 1.5,
    justifyContent: "center",
    minHeight: 50,
  },
  adviceBtnPressed: { opacity: 0.7 },
  adviceBtnText: { color: finoptTheme.colors.primary, fontWeight: "800" },
});
