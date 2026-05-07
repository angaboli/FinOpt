import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { useIncomeSourcesStore } from "@/application/income_sources/incomeSourcesStore";
import { IncomeSourceCard } from "@/presentation/components/IncomeSourceCard";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Incomes">;

export function IncomesScreen({ navigation }: Props) {
  const incomeSources = useIncomeSourcesStore((state) => state.incomeSources);
  const isLoading = useIncomeSourcesStore((state) => state.isLoading);
  const error = useIncomeSourcesStore((state) => state.error);
  const loadIncomeSources = useIncomeSourcesStore((state) => state.loadIncomeSources);
  const deleteIncomeSource = useIncomeSourcesStore((state) => state.deleteIncomeSource);

  useEffect(() => {
    void loadIncomeSources();
  }, [loadIncomeSources]);

  const totalMonthly = incomeSources.reduce((sum, s) => {
    switch (s.frequency) {
      case "MONTHLY":
        return sum + s.amount;
      case "WEEKLY":
        return sum + s.amount * 4.33;
      case "BIWEEKLY":
        return sum + s.amount * 2.17;
      case "QUARTERLY":
        return sum + s.amount / 3;
      case "ANNUAL":
        return sum + s.amount / 12;
      default:
        return sum;
    }
  }, 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>Mes revenus</Text>
          <Text style={styles.subtitle}>Gérez vos sources de revenus réguliers et ponctuels.</Text>
        </View>

        {incomeSources.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>ÉQUIVALENT MENSUEL</Text>
            <Text style={styles.summaryAmount}>
              {new Intl.NumberFormat("fr-FR", { currency: "EUR", style: "currency" }).format(
                totalMonthly,
              )}
            </Text>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isLoading && incomeSources.length === 0 ? (
          <Text style={styles.empty}>Chargement...</Text>
        ) : incomeSources.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucun revenu déclaré</Text>
            <Text style={styles.emptyText}>
              Ajoutez vos sources de revenus pour suivre votre budget.
            </Text>
          </View>
        ) : (
          incomeSources.map((source) => (
            <IncomeSourceCard
              key={source.id}
              source={source}
              onDelete={(id) => void deleteIncomeSource(id)}
            />
          ))
        )}

        <Pressable
          accessibilityLabel="Ajouter une source de revenus"
          accessibilityRole="button"
          onPress={() => navigation.navigate("AddIncome")}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Ajouter un revenu</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: finoptTheme.colors.background,
    flex: 1,
  },
  content: {
    gap: finoptTheme.spacing.lg,
    padding: finoptTheme.spacing.xl,
    paddingBottom: finoptTheme.spacing.xxl,
  },
  hero: {
    gap: finoptTheme.spacing.xs,
  },
  title: {
    color: finoptTheme.colors.foreground,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: finoptTheme.colors.gray600,
    lineHeight: 21,
  },
  summaryCard: {
    backgroundColor: finoptTheme.colors.primaryLight,
    borderRadius: finoptTheme.radius.xl,
    padding: finoptTheme.spacing.lg,
  },
  summaryLabel: {
    color: finoptTheme.colors.gray700,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: finoptTheme.spacing.xs,
  },
  summaryAmount: {
    color: finoptTheme.colors.primary,
    fontSize: 28,
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1,
    gap: finoptTheme.spacing.sm,
    padding: finoptTheme.spacing.lg,
  },
  emptyTitle: {
    color: finoptTheme.colors.foreground,
    fontWeight: "800",
  },
  emptyText: {
    color: finoptTheme.colors.gray600,
    lineHeight: 20,
  },
  empty: {
    color: finoptTheme.colors.gray600,
    textAlign: "center",
  },
  error: {
    color: finoptTheme.colors.danger,
    fontWeight: "700",
  },
  button: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.primary,
    borderRadius: finoptTheme.radius.lg,
    justifyContent: "center",
    minHeight: 54,
    ...finoptTheme.shadow.action,
  },
  buttonPressed: {
    backgroundColor: finoptTheme.colors.primaryDark,
  },
  buttonText: {
    color: finoptTheme.colors.white,
    fontWeight: "800",
  },
});
