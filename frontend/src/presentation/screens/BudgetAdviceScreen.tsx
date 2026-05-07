import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import type { BudgetSentiment } from "@/domain/savingsGoals/types";
import { useSavingsGoalsStore } from "@/application/savingsGoals/savingsGoalsStore";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "BudgetAdvice">;

const t = finoptTheme;

const SENTIMENT_CONFIG: Record<
  BudgetSentiment,
  { bg: string; border: string; text: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }
> = {
  positive: {
    bg: t.colors.primaryLight,
    border: t.colors.primary,
    text: t.colors.primary,
    icon: "trending-up",
    iconColor: t.colors.primary,
  },
  neutral: {
    bg: t.colors.accent,
    border: t.colors.border,
    text: t.colors.gray700,
    icon: "remove",
    iconColor: t.colors.gray600,
  },
  negative: {
    bg: "#FEE2E2",
    border: t.colors.danger,
    text: t.colors.danger,
    icon: "trending-down",
    iconColor: t.colors.danger,
  },
};

export function BudgetAdviceScreen({ navigation: _navigation }: Props) {
  const advice = useSavingsGoalsStore((s) => s.advice);
  const isGenerating = useSavingsGoalsStore((s) => s.isGenerating);
  const error = useSavingsGoalsStore((s) => s.error);
  const generateAdvice = useSavingsGoalsStore((s) => s.generateAdvice);

  const now = new Date();
  const sentiment = advice?.sentiment ?? "neutral";
  const cfg = SENTIMENT_CONFIG[sentiment];

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
            <View style={[styles.sentimentBanner, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
              <Ionicons name={cfg.icon} size={22} color={cfg.iconColor} />
              <View style={{ flex: 1 }}>
                <Text style={styles.periodText}>{advice.periodLabel}</Text>
                <Text style={[styles.sentimentLabel, { color: cfg.text }]}>
                  {sentiment === "positive" ? "Situation favorable" : sentiment === "negative" ? "Points de vigilance" : "Situation équilibrée"}
                </Text>
              </View>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
              <Text style={styles.sectionLabel}>RÉSUMÉ</Text>
              <Text style={[styles.summaryText, { color: sentiment === "negative" ? "#991B1B" : t.colors.foreground }]}>
                {advice.summary}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>CONSEILS PRATIQUES</Text>
              {advice.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={cfg.iconColor} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            {advice.savingsAdvice ? (
              <View style={[styles.savingsCard, { borderColor: cfg.border }]}>
                <View style={styles.savingsHeader}>
                  <Ionicons name="flag-outline" size={18} color={cfg.iconColor} />
                  <Text style={styles.sectionLabel}>ÉPARGNE</Text>
                </View>
                <Text style={styles.savingsText}>{advice.savingsAdvice}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="bulb-outline" size={40} color={t.colors.gray400} />
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
          <Ionicons name={isGenerating ? "hourglass-outline" : "sparkles-outline"} size={18} color={t.colors.white} />
          <Text style={styles.buttonText}>
            {isGenerating ? "Analyse en cours..." : advice ? "Actualiser les conseils" : "Générer les conseils"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: t.colors.background, flex: 1 },
  content: { gap: t.spacing.lg, padding: t.spacing.xl, paddingBottom: t.spacing.xxl },
  hero: { gap: t.spacing.xs },
  title: { color: t.colors.foreground, fontSize: 30, fontWeight: "800" },
  subtitle: { color: t.colors.gray600, lineHeight: 21 },
  error: { color: t.colors.danger, fontWeight: "700" },
  sentimentBanner: {
    alignItems: "center",
    borderRadius: t.radius.xl,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: t.spacing.md,
    padding: t.spacing.lg,
  },
  periodText: { color: t.colors.gray600, fontSize: 11, fontWeight: "700" },
  sentimentLabel: { fontWeight: "800", fontSize: 15, marginTop: 2 },
  summaryCard: {
    borderRadius: t.radius.xl,
    borderWidth: 1.5,
    gap: t.spacing.sm,
    padding: t.spacing.lg,
  },
  sectionLabel: { color: t.colors.gray700, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  summaryText: { lineHeight: 22 },
  card: {
    backgroundColor: t.colors.card,
    borderColor: t.colors.border,
    borderRadius: t.radius.xl,
    borderWidth: 1,
    gap: t.spacing.md,
    padding: t.spacing.lg,
  },
  tipRow: { alignItems: "flex-start", flexDirection: "row", gap: t.spacing.sm },
  tipText: { color: t.colors.foreground, flex: 1, lineHeight: 22 },
  savingsCard: {
    backgroundColor: t.colors.card,
    borderRadius: t.radius.xl,
    borderWidth: 1.5,
    gap: t.spacing.sm,
    padding: t.spacing.lg,
  },
  savingsHeader: { alignItems: "center", flexDirection: "row", gap: t.spacing.sm },
  savingsText: { color: t.colors.foreground, lineHeight: 22 },
  emptyCard: {
    alignItems: "center",
    backgroundColor: t.colors.card,
    borderColor: t.colors.border,
    borderRadius: t.radius.xl,
    borderWidth: 1,
    gap: t.spacing.md,
    padding: t.spacing.xl,
  },
  emptyTitle: { color: t.colors.foreground, fontWeight: "800", fontSize: 16 },
  emptyText: { color: t.colors.gray600, lineHeight: 20, textAlign: "center" },
  button: {
    alignItems: "center",
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.lg,
    flexDirection: "row",
    gap: t.spacing.sm,
    justifyContent: "center",
    minHeight: 54,
    ...t.shadow.action,
  },
  buttonPressed: { backgroundColor: t.colors.primaryDark },
  buttonText: { color: t.colors.white, fontWeight: "800" },
});
