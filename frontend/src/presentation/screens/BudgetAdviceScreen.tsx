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
            Analyse de tout votre historique financier par l'intelligence artificielle.
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {advice ? (
          <>
            {/* Sentiment banner */}
            <View style={[styles.sentimentBanner, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
              <Ionicons name={cfg.icon} size={22} color={cfg.iconColor} />
              <View style={{ flex: 1 }}>
                <Text style={styles.periodText}>{advice.periodLabel}</Text>
                <Text style={[styles.sentimentLabel, { color: cfg.text }]}>
                  {sentiment === "positive" ? "Situation favorable" : sentiment === "negative" ? "Points de vigilance" : "Situation équilibrée"}
                </Text>
              </View>
            </View>

            {/* Summary */}
            <View style={[styles.summaryCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
              <Text style={styles.sectionLabel}>RÉSUMÉ</Text>
              <Text style={[styles.summaryText, { color: sentiment === "negative" ? "#991B1B" : t.colors.foreground }]}>
                {advice.summary}
              </Text>
            </View>

            {/* Practical tips */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>CONSEILS PRATIQUES</Text>
              {advice.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={cfg.iconColor} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Cut suggestions — only shown when present */}
            {advice.cutSuggestions.length > 0 && (
              <View style={[styles.card, styles.cutCard]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="cut-outline" size={16} color={t.colors.danger} />
                  <Text style={[styles.sectionLabel, { color: t.colors.danger }]}>DÉPENSES À RÉDUIRE</Text>
                </View>
                <Text style={styles.cardHint}>
                  Vos revenus sont en baisse — voici ce qu'il est possible de réduire ou supprimer.
                </Text>
                {advice.cutSuggestions.map((item, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Ionicons name="remove-circle-outline" size={16} color={t.colors.danger} />
                    <Text style={[styles.tipText, styles.cutText]}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Merchant optimisation plan */}
            {advice.merchantPlan.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="cart-outline" size={16} color={t.colors.primary} />
                  <Text style={styles.sectionLabel}>PLAN D'ACHATS OPTIMISÉ</Text>
                </View>
                <Text style={styles.cardHint}>
                  Basé sur vos habitudes, voici où concentrer vos achats pour optimiser vos dépenses.
                </Text>
                {advice.merchantPlan.map((entry, i) => (
                  <View key={i} style={styles.merchantBlock}>
                    <View style={styles.merchantHeader}>
                      <Ionicons name="storefront-outline" size={15} color={t.colors.primary} />
                      <Text style={styles.merchantName}>{entry.merchant}</Text>
                    </View>
                    <Text style={styles.merchantReason}>{entry.reason}</Text>
                    <View style={styles.itemsList}>
                      {entry.items.map((item, j) => (
                        <View key={j} style={styles.itemChip}>
                          <Text style={styles.itemChipText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Savings advice */}
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
              Appuyez sur le bouton ci-dessous pour générer vos conseils personnalisés basés sur tout votre historique.
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
  cardHeader: { alignItems: "center", flexDirection: "row", gap: t.spacing.xs },
  cardHint: { color: t.colors.gray600, fontSize: 12, lineHeight: 18, marginTop: -t.spacing.xs },
  tipRow: { alignItems: "flex-start", flexDirection: "row", gap: t.spacing.sm },
  tipText: { color: t.colors.foreground, flex: 1, lineHeight: 22 },
  cutCard: { borderColor: "#FECACA", borderWidth: 1.5 },
  cutText: { color: "#991B1B" },
  merchantBlock: {
    borderColor: t.colors.border,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    gap: t.spacing.sm,
    padding: t.spacing.md,
  },
  merchantHeader: { alignItems: "center", flexDirection: "row", gap: t.spacing.xs },
  merchantName: { color: t.colors.primary, fontWeight: "800", fontSize: 14 },
  merchantReason: { color: t.colors.gray600, fontSize: 12, lineHeight: 18 },
  itemsList: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing.xs },
  itemChip: {
    backgroundColor: t.colors.primaryLight,
    borderRadius: t.radius.sm,
    paddingHorizontal: t.spacing.sm,
    paddingVertical: 3,
  },
  itemChipText: { color: t.colors.primary, fontSize: 12, fontWeight: "700" },
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
