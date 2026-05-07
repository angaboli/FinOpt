import { useEffect, useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useBudgetsStore } from "@/application/budgets/budgetsStore";
import { useCategoriesStore } from "@/application/categories/categoriesStore";
import { useTransactionsStore } from "@/application/transactions/transactionsStore";
import type { RootStackParamList } from "../../../App";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Budget">;

const currencyFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function BudgetScreen({ navigation }: Props) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const budget = useBudgetsStore((s) => s.budget);
  const isLoading = useBudgetsStore((s) => s.isLoading);
  const loadBudget = useBudgetsStore((s) => s.loadBudget);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.loadCategories);
  const transactions = useTransactionsStore((s) => s.transactions);
  const loadTransactions = useTransactionsStore((s) => s.loadTransactions);

  useEffect(() => {
    void loadBudget(year, month);
    void loadCategories();
    void loadTransactions();
  }, [loadBudget, loadCategories, loadTransactions, year, month]);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0);
    const lastDayStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
    for (const tx of transactions) {
      if (tx.transactionType === "EXPENSE" && tx.date >= firstDay && tx.date <= lastDayStr) {
        map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + tx.amount);
      }
    }
    return map;
  }, [transactions, year, month]);

  const totalSpent = useMemo(
    () => Array.from(spentByCategory.values()).reduce((s, v) => s + v, 0),
    [spentByCategory],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={finoptTheme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Ce mois-ci</Text>
        <Text style={styles.summarySpent}>{currencyFormatter.format(totalSpent)}</Text>
        <Text style={styles.summaryPlanned}>
          sur {budget ? currencyFormatter.format(budget.totalPlanned) : "—"} planifié
        </Text>
        {budget && budget.totalPlanned > 0 && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((totalSpent / budget.totalPlanned) * 100, 100)}%` as any,
                  backgroundColor:
                    totalSpent > budget.totalPlanned
                      ? finoptTheme.colors.danger
                      : finoptTheme.colors.primary,
                },
              ]}
            />
          </View>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Par catégorie</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate("SetBudget")}
        >
          <Text style={styles.editButtonText}>Modifier</Text>
        </TouchableOpacity>
      </View>

      {categories.map((cat) => {
        const planned = budget?.lines.find((l) => l.categoryId === cat.id)?.plannedAmount ?? 0;
        const spent = spentByCategory.get(cat.id) ?? 0;
        const ratio = planned > 0 ? Math.min(spent / planned, 1) : 0;
        const over = planned > 0 && spent > planned;

        return (
          <View key={cat.id} style={styles.categoryRow}>
            <View style={styles.categoryHeader}>
              <View style={[styles.dot, { backgroundColor: cat.color }]} />
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={[styles.categoryAmount, over && styles.overBudget]}>
                {currencyFormatter.format(spent)}
                {planned > 0 ? ` / ${currencyFormatter.format(planned)}` : ""}
              </Text>
            </View>
            {planned > 0 && (
              <View style={styles.categoryBar}>
                <View
                  style={[
                    styles.categoryBarFill,
                    {
                      width: `${ratio * 100}%` as any,
                      backgroundColor: over ? finoptTheme.colors.danger : cat.color,
                    },
                  ]}
                />
              </View>
            )}
          </View>
        );
      })}

      {categories.length === 0 && (
        <Text style={styles.empty}>Aucune catégorie</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: finoptTheme.colors.background },
  content: { padding: finoptTheme.spacing.lg, gap: finoptTheme.spacing.md },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  summaryCard: {
    backgroundColor: finoptTheme.colors.card,
    borderRadius: finoptTheme.radius.xl,
    padding: finoptTheme.spacing.xl,
    alignItems: "center",
    ...finoptTheme.shadow.card,
  },
  summaryLabel: { fontSize: 13, color: finoptTheme.colors.gray500, marginBottom: 4 },
  summarySpent: { fontSize: 36, fontWeight: "800", color: finoptTheme.colors.foreground },
  summaryPlanned: { fontSize: 14, color: finoptTheme.colors.gray600, marginTop: 4 },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: finoptTheme.colors.muted,
    borderRadius: 4,
    marginTop: finoptTheme.spacing.md,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: finoptTheme.spacing.sm,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: finoptTheme.colors.foreground },
  editButton: {
    backgroundColor: finoptTheme.colors.primaryLight,
    paddingHorizontal: finoptTheme.spacing.md,
    paddingVertical: finoptTheme.spacing.xs,
    borderRadius: finoptTheme.radius.md,
  },
  editButtonText: { color: finoptTheme.colors.primary, fontWeight: "600", fontSize: 13 },
  categoryRow: {
    backgroundColor: finoptTheme.colors.card,
    borderRadius: finoptTheme.radius.lg,
    padding: finoptTheme.spacing.md,
    gap: finoptTheme.spacing.xs,
    ...finoptTheme.shadow.card,
  },
  categoryHeader: { flexDirection: "row", alignItems: "center", gap: finoptTheme.spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { flex: 1, fontSize: 14, fontWeight: "600", color: finoptTheme.colors.foreground },
  categoryAmount: { fontSize: 13, color: finoptTheme.colors.gray600 },
  overBudget: { color: finoptTheme.colors.danger, fontWeight: "700" },
  categoryBar: {
    height: 6,
    backgroundColor: finoptTheme.colors.muted,
    borderRadius: 3,
    overflow: "hidden",
  },
  categoryBarFill: { height: "100%", borderRadius: 3 },
  empty: { textAlign: "center", color: finoptTheme.colors.gray500, marginTop: finoptTheme.spacing.xl },
});
