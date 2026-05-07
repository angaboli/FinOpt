import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { useAccountsStore } from "@/application/accounts/accountsStore";
import { useCategoriesStore } from "@/application/categories/categoriesStore";
import { useTransactionsStore } from "@/application/transactions/transactionsStore";
import type { TransactionSummary } from "@/domain/transactions/types";
import { TransactionCard } from "@/presentation/components/TransactionCard";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Transactions">;

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" });

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return dateFormatter.format(new Date(y, m - 1, d));
}

function groupByMonth(summaries: TransactionSummary[]): Array<{ month: string; items: TransactionSummary[] }> {
  const map = new Map<string, TransactionSummary[]>();
  for (const tx of summaries) {
    const [y, m] = tx.date.split("-");
    const key = `${y}-${m}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return Array.from(map.entries()).map(([key, items]) => {
    const [y, m] = key.split("-").map(Number);
    const month = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
      new Date(y, m - 1, 1),
    );
    return { month: month.charAt(0).toUpperCase() + month.slice(1), items };
  });
}

export function TransactionsScreen({ navigation }: Props) {
  const transactions = useTransactionsStore((s) => s.transactions);
  const isLoading = useTransactionsStore((s) => s.isLoading);
  const loadTransactions = useTransactionsStore((s) => s.loadTransactions);
  const accounts = useAccountsStore((s) => s.accounts);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.loadCategories);

  useEffect(() => {
    void loadTransactions();
    void loadCategories();
  }, [loadTransactions, loadCategories]);

  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const summaries: TransactionSummary[] = useMemo(
    () =>
      transactions.map((tx) => {
        const account = accountMap.get(tx.accountId);
        const category = categoryMap.get(tx.categoryId);
        return {
          id: tx.id,
          title: tx.title,
          amount: tx.amount,
          category: category?.name ?? "—",
          date: tx.date,
          accountName: account?.name ?? "—",
          accountColor: account?.color ?? finoptTheme.colors.gray400,
          type: tx.transactionType === "INCOME" ? "income" : "expense",
        };
      }),
    [transactions, accountMap, categoryMap],
  );

  const grouped = useMemo(() => groupByMonth(summaries), [summaries]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.title}>Transactions</Text>
              <Text style={styles.subtitle}>Historique complet de vos flux financiers.</Text>
            </View>
            <Pressable
              accessibilityLabel="Ajouter une transaction"
              accessibilityRole="button"
              onPress={() => navigation.navigate("AddTransaction")}
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.addBtnText}>+ Ajouter</Text>
            </Pressable>
          </View>
        </View>

        {isLoading && transactions.length === 0 ? (
          <Text style={styles.empty}>Chargement...</Text>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucune transaction</Text>
            <Text style={styles.emptyText}>Ajoutez votre première transaction.</Text>
          </View>
        ) : (
          grouped.map(({ month, items }) => (
            <View key={month}>
              <Text style={styles.monthLabel}>{month}</Text>
              <View style={styles.group}>
                {items.map((tx) => (
                  <Pressable
                    key={tx.id}
                    onPress={() => navigation.navigate("EditTransaction", { transactionId: tx.id })}
                    accessibilityLabel={`Modifier ${tx.title}`}
                    accessibilityRole="button"
                  >
                    <TransactionCard transaction={{ ...tx, date: formatDate(tx.date) }} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: finoptTheme.colors.background, flex: 1 },
  content: { gap: finoptTheme.spacing.lg, padding: finoptTheme.spacing.xl, paddingBottom: finoptTheme.spacing.xxl },
  hero: { gap: finoptTheme.spacing.xs },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  title: { color: finoptTheme.colors.foreground, fontSize: 30, fontWeight: "800" },
  subtitle: { color: finoptTheme.colors.gray600, lineHeight: 21 },
  addBtn: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.primary,
    borderRadius: finoptTheme.radius.lg,
    justifyContent: "center",
    paddingHorizontal: finoptTheme.spacing.lg,
    paddingVertical: finoptTheme.spacing.sm,
    ...finoptTheme.shadow.action,
  },
  addBtnText: { color: finoptTheme.colors.white, fontWeight: "800", fontSize: 13 },
  monthLabel: {
    color: finoptTheme.colors.gray700,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: finoptTheme.spacing.sm,
    textTransform: "uppercase",
  },
  group: {
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1,
    gap: finoptTheme.spacing.sm,
    marginBottom: finoptTheme.spacing.lg,
    padding: finoptTheme.spacing.lg,
    ...finoptTheme.shadow.card,
  },
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
  empty: { color: finoptTheme.colors.gray600, textAlign: "center" },
});
