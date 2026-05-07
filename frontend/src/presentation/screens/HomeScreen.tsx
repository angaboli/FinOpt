import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { useAccountsStore } from "@/application/accounts/accountsStore";
import { useAuthStore } from "@/application/auth/authStore";
import { useBudgetAlert } from "@/application/notifications/useBudgetAlert";
import { useBudgetsStore } from "@/application/budgets/budgetsStore";
import { useCategoriesStore } from "@/application/categories/categoriesStore";
import { useTransactionsStore } from "@/application/transactions/transactionsStore";
import { AccountSwitcher } from "@/presentation/components/AccountSwitcher";
import { BottomNav, type BottomTab } from "@/presentation/components/BottomNav";
import { TransactionCard } from "@/presentation/components/TransactionCard";
import { finoptTheme } from "@/presentation/theme/theme";

const logo = require("../../../assets/FinOptLogo.png") as number;

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" });
const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const accounts = useAccountsStore((state) => state.accounts);
  const selectedAccountId = useAccountsStore((state) => state.selectedAccountId);
  const selectAccount = useAccountsStore((state) => state.selectAccount);
  const loadAccounts = useAccountsStore((state) => state.loadAccounts);
  const accountsError = useAccountsStore((state) => state.error);
  const transactions = useTransactionsStore((state) => state.transactions);
  const loadTransactions = useTransactionsStore((state) => state.loadTransactions);
  const categories = useCategoriesStore((state) => state.categories);
  const loadCategories = useCategoriesStore((state) => state.loadCategories);
  const budget = useBudgetsStore((s) => s.budget);
  const loadBudget = useBudgetsStore((s) => s.loadBudget);
  const [activeTab, setActiveTab] = useState<BottomTab>("home");

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;

  const totalBalance = useMemo(
    () => accounts.reduce((total, account) => total + account.balance, 0),
    [accounts],
  );
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const recentSummaries = useMemo(
    () =>
      transactions.slice(0, 5).map((tx) => {
        const account = accountMap.get(tx.accountId);
        const category = categoryMap.get(tx.categoryId);
        const [y, m, d] = tx.date.split("-").map(Number);
        return {
          id: tx.id,
          title: tx.title,
          amount: tx.amount,
          category: category?.name ?? "—",
          date: dateFormatter.format(new Date(y, m - 1, d)),
          accountName: account?.name ?? "—",
          accountColor: account?.color ?? finoptTheme.colors.gray400,
          type: tx.transactionType === "INCOME" ? ("income" as const) : ("expense" as const),
        };
      }),
    [transactions, accountMap, categoryMap],
  );

  const thisMonthPrefix = `${thisYear}-${String(thisMonth).padStart(2, "0")}`;
  const prevMonth = thisMonth === 1 ? 12 : thisMonth - 1;
  const prevYear = thisMonth === 1 ? thisYear - 1 : thisYear;
  const prevMonthPrefix = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

  const monthlyIncome = useMemo(
    () =>
      transactions
        .filter((tx) => tx.transactionType === "INCOME" && tx.date.startsWith(thisMonthPrefix))
        .reduce((s, tx) => s + tx.amount, 0),
    [transactions, thisMonthPrefix],
  );
  const monthlyExpenses = useMemo(
    () =>
      transactions
        .filter((tx) => tx.transactionType === "EXPENSE" && tx.date.startsWith(thisMonthPrefix))
        .reduce((s, tx) => s + tx.amount, 0),
    [transactions, thisMonthPrefix],
  );
  const prevMonthExpenses = useMemo(
    () =>
      transactions
        .filter((tx) => tx.transactionType === "EXPENSE" && tx.date.startsWith(prevMonthPrefix))
        .reduce((s, tx) => s + tx.amount, 0),
    [transactions, prevMonthPrefix],
  );

  const trendLabel = useMemo(() => {
    if (prevMonthExpenses === 0) return null;
    const diff = ((monthlyExpenses - prevMonthExpenses) / prevMonthExpenses) * 100;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${diff.toFixed(1)}% dépenses vs mois dernier`;
  }, [monthlyExpenses, prevMonthExpenses]);

  const budgetRatio = useMemo(() => {
    if (!budget || budget.totalPlanned === 0) return null;
    return Math.min(monthlyExpenses / budget.totalPlanned, 1);
  }, [budget, monthlyExpenses]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    void loadTransactions();
    void loadCategories();
    void loadBudget(thisYear, thisMonth);
  }, [loadTransactions, loadCategories, loadBudget, thisYear, thisMonth]);

  useBudgetAlert(monthlyExpenses, budget?.totalPlanned);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <View style={styles.notificationDot} />
        </View>

        {accounts.length > 0 && selectedAccountId ? (
          <AccountSwitcher
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelectAccount={selectAccount}
          />
        ) : (
          <View style={styles.emptyAccountsCard}>
            <Text style={styles.sectionTitle}>Aucun compte</Text>
            <Text style={styles.subtitle}>
              Ajoutez votre premier compte pour commencer le suivi multi-comptes.
            </Text>
          </View>
        )}
        {accountsError ? <Text style={styles.error}>{accountsError}</Text> : null}

        <View style={styles.balanceCard}>
          <Text style={styles.kicker}>SOLDE DISPONIBLE</Text>
          <Text style={[styles.balance, totalBalance < 0 && styles.balanceNegative]}>
            {currencyFormatter.format(totalBalance)}
          </Text>
          {trendLabel ? (
            <View style={styles.trendPill}>
              <Text style={styles.trendText}>{trendLabel}</Text>
            </View>
          ) : null}
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Revenus ce mois</Text>
              <Text style={styles.metricValue}>{currencyFormatter.format(monthlyIncome)}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Dépenses</Text>
              <Text style={styles.metricValue}>{currencyFormatter.format(monthlyExpenses)}</Text>
            </View>
          </View>
          {budgetRatio !== null && (
            <View style={styles.budgetSection}>
              <View style={styles.budgetLabelRow}>
                <Text style={styles.budgetLabel}>Budget mensuel</Text>
                <Text style={styles.budgetPct}>{Math.round(budgetRatio * 100)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${budgetRatio * 100}%` as any,
                      backgroundColor:
                        budgetRatio >= 1 ? finoptTheme.colors.danger : finoptTheme.colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.transactionsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions récentes</Text>
            <Pressable onPress={() => navigation.navigate("Transactions")}>
              <Text style={styles.sectionAction}>Voir tout</Text>
            </Pressable>
          </View>
          {recentSummaries.length > 0 ? (
            recentSummaries.map((summary) => (
              <TransactionCard key={summary.id} transaction={summary} />
            ))
          ) : (
            <Text style={styles.subtitle}>Aucune transaction ce mois-ci</Text>
          )}
        </View>

        <View style={styles.quickActions}>
          <Pressable
            accessibilityLabel="Gerer les comptes"
            accessibilityRole="button"
            onPress={() => navigation.navigate("Accounts")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Mes comptes</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Mes revenus"
            accessibilityRole="button"
            onPress={() => navigation.navigate("Incomes")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Mes revenus</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Budget mensuel"
            accessibilityRole="button"
            onPress={() => navigation.navigate("Budget")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Budget</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Importer un relevé"
            accessibilityRole="button"
            onPress={() => navigation.navigate("Import")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Import</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Scanner un ticket"
            accessibilityRole="button"
            onPress={() => navigation.navigate("ScanReceipt")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Scan</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Objectifs d'épargne"
            accessibilityRole="button"
            onPress={() => navigation.navigate("SavingsGoals")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Épargne</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Conseils IA"
            accessibilityRole="button"
            onPress={() => navigation.navigate("BudgetAdvice")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Conseils IA</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Deconnexion"
          onPress={logout}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Déconnexion</Text>
        </Pressable>
      </ScrollView>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: finoptTheme.colors.background },
  content: { gap: finoptTheme.spacing.lg, paddingBottom: 110, padding: finoptTheme.spacing.xl },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: finoptTheme.spacing.sm,
  },
  logo: { width: 120, height: 40 },
  notificationDot: {
    backgroundColor: finoptTheme.colors.primary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  balanceCard: {
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    padding: finoptTheme.spacing.xl,
    ...finoptTheme.shadow.card,
  },
  kicker: {
    color: finoptTheme.colors.gray700,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: finoptTheme.spacing.sm,
  },
  balance: { color: finoptTheme.colors.foreground, fontSize: 38, fontWeight: "800" },
  balanceNegative: { color: finoptTheme.colors.danger },
  trendPill: {
    alignSelf: "flex-start",
    backgroundColor: finoptTheme.colors.primaryLight,
    borderRadius: finoptTheme.radius.sm,
    marginTop: finoptTheme.spacing.md,
    paddingHorizontal: finoptTheme.spacing.sm,
    paddingVertical: 6,
  },
  trendText: { color: finoptTheme.colors.primary, fontSize: 12, fontWeight: "700" },
  metrics: { flexDirection: "row", gap: finoptTheme.spacing.lg, marginTop: finoptTheme.spacing.xl },
  metric: { flex: 1 },
  metricLabel: { color: finoptTheme.colors.gray600, fontSize: 12, marginBottom: finoptTheme.spacing.xs },
  metricValue: { color: finoptTheme.colors.foreground, fontSize: 18, fontWeight: "800" },
  budgetSection: { marginTop: finoptTheme.spacing.lg, gap: finoptTheme.spacing.xs },
  budgetLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  budgetLabel: { fontSize: 12, color: finoptTheme.colors.gray600 },
  budgetPct: { fontSize: 12, fontWeight: "700", color: finoptTheme.colors.foreground },
  progressBar: {
    height: 6,
    backgroundColor: finoptTheme.colors.muted,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  emptyAccountsCard: {
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1,
    gap: finoptTheme.spacing.sm,
    padding: finoptTheme.spacing.lg,
  },
  error: { color: finoptTheme.colors.danger, fontWeight: "700" },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: finoptTheme.spacing.xs,
  },
  sectionTitle: { color: finoptTheme.colors.foreground, fontSize: 16, fontWeight: "800" },
  sectionAction: { color: finoptTheme.colors.gray600, fontSize: 13, fontWeight: "700" },
  transactionsCard: {
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1,
    gap: finoptTheme.spacing.md,
    padding: finoptTheme.spacing.lg,
    ...finoptTheme.shadow.card,
  },
  subtitle: { color: finoptTheme.colors.gray600, marginTop: finoptTheme.spacing.xs },
  quickActions: { flexDirection: "row", gap: finoptTheme.spacing.md },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.gray600,
    borderRadius: finoptTheme.radius.lg,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  secondaryButtonText: { color: finoptTheme.colors.foreground, fontWeight: "800", fontSize: 12 },
  button: {
    minHeight: 48,
    borderRadius: finoptTheme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: finoptTheme.colors.primary,
    ...finoptTheme.shadow.action,
  },
  buttonPressed: { backgroundColor: finoptTheme.colors.primaryDark },
  buttonText: { color: finoptTheme.colors.white, fontWeight: "700" },
});
