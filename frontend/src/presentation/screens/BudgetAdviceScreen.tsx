import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { useSavingsGoalsStore } from "@/application/savingsGoals/savingsGoalsStore";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "BudgetAdvice">;

export function BudgetAdviceScreen({ navigation: _navigation }: Props) {
  const advice = useSavingsGoalsStore((s) => s.advice);
  const isGenerating = useSavingsGoalsStore((s) => s.isGenerating);
  const error = useSavingsGoalsStore((s) => s.error);
  const generateAdvice = useSavingsGoalsStore((s) => s.generateAdvice);

  const now = new Date();

  async function handleGenerate() {
    await generateAdvice(now.getFullYear(), now.getMonth() + 1);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>Conseils IA</Text>
          <Text style={styles.subtitle}>
            Analyse personnalisée de votre situation financière par l'intelligence artificielle.
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {advice ? (
          <>
            <View style={styles.periodBadge}>
              <Text style={styles.periodText}>{advice.periodLabel}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.sectionLabel}>Résumé</Text>
              <Text style={styles.summaryText}>{advice.summary}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Conseils pratiques</Text>
              {advice.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            {advice.savingsAdvice ? (
              <View style={styles.savingsCard}>
                <Text style={styles.sectionLabel}>Épargne</Text>
                <Text style={styles.savingsText}>{advice.savingsAdvice}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucune analyse disponible</Text>
            <Text style={styles.emptyText}>
              Appuyez sur le bouton ci-dessous pour générer vos conseils personnalisés du mois.
            </Text>
          </View>
        )}

        <Pressable
          accessibilityLabel="Générer les conseils IA"
          accessibilityRole="button"
          disabled={isGenerating}
          onPress={handleGenerate}
          style={({ pressed }) => [styles.button, (isGenerating || pressed) && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>
            {isGenerating ? "Analyse en cours..." : advice ? "Actualiser les conseils" : "Générer les conseils"}
          </Text>
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
  periodBadge: {
    alignSelf: "flex-start",
    backgroundColor: finoptTheme.colors.primaryLight,
    borderRadius: finoptTheme.radius.sm,
    paddingHorizontal: finoptTheme.spacing.md,
    paddingVertical: finoptTheme.spacing.xs,
  },
  periodText: { color: finoptTheme.colors.primary, fontWeight: "700", fontSize: 12 },
  summaryCard: {
    backgroundColor: finoptTheme.colors.primaryLight,
    borderRadius: finoptTheme.radius.xl,
    gap: finoptTheme.spacing.sm,
    padding: finoptTheme.spacing.lg,
  },
  sectionLabel: { color: finoptTheme.colors.gray700, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  summaryText: { color: finoptTheme.colors.foreground, lineHeight: 22 },
  card: {
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1,
    gap: finoptTheme.spacing.md,
    padding: finoptTheme.spacing.lg,
  },
  tipRow: { flexDirection: "row", gap: finoptTheme.spacing.sm },
  tipBullet: { color: finoptTheme.colors.primary, fontWeight: "800", fontSize: 16 },
  tipText: { color: finoptTheme.colors.foreground, flex: 1, lineHeight: 22 },
  savingsCard: {
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.primary,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1.5,
    gap: finoptTheme.spacing.sm,
    padding: finoptTheme.spacing.lg,
  },
  savingsText: { color: finoptTheme.colors.foreground, lineHeight: 22 },
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
});
