import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { showAlert } from "@/application/alert/alertStore";

import type { RootStackParamList } from "../../../App";
import { useAccountsStore } from "@/application/accounts/accountsStore";
import { useCategoriesStore } from "@/application/categories/categoriesStore";
import { useIncomeSourcesStore } from "@/application/income_sources/incomeSourcesStore";
import { useTransactionsStore } from "@/application/transactions/transactionsStore";
import { categoryIcon } from "@/domain/categories/categoryIcons";
import type { Frequency } from "@/domain/income_sources/types";
import { FREQUENCY_LABELS } from "@/domain/income_sources/types";
import type { TransactionType } from "@/domain/transactions/types";
import { incomeSourcesApi } from "@/infrastructure/api/incomeSourcesApi";
import { DatePickerButton } from "@/presentation/components/DatePickerButton";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "AddTransaction">;

const t = finoptTheme;

const types: Array<{ value: TransactionType; label: string }> = [
  { value: "EXPENSE", label: "Dépense" },
  { value: "INCOME", label: "Revenu" },
];

const frequencies: Frequency[] = ["ONCE", "MONTHLY", "WEEKLY", "BIWEEKLY", "QUARTERLY", "ANNUAL"];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddTransactionScreen({ navigation }: Props) {
  const accounts = useAccountsStore((s) => s.accounts);
  const selectedAccountId = useAccountsStore((s) => s.selectedAccountId);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.loadCategories);
  const incomeSources = useIncomeSourcesStore((s) => s.incomeSources);
  const loadIncomeSources = useIncomeSourcesStore((s) => s.loadIncomeSources);
  const transactions = useTransactionsStore((s) => s.transactions);
  const createTransaction = useTransactionsStore((s) => s.createTransaction);
  const isLoading = useTransactionsStore((s) => s.isLoading);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState<TransactionType>("EXPENSE");
  const [accountId, setAccountId] = useState(selectedAccountId ?? accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [frequency, setFrequency] = useState<Frequency>("ONCE");

  useEffect(() => {
    void loadCategories();
    void loadIncomeSources();
  }, [loadCategories, loadIncomeSources]);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  // Reset frequency when switching to EXPENSE
  useEffect(() => {
    if (transactionType === "EXPENSE") setFrequency("ONCE");
  }, [transactionType]);

  const parsedAmount = Number(amount.replace(",", ".") || "0");
  const canSubmit =
    title.trim().length > 0 &&
    parsedAmount > 0 &&
    accountId.length > 0 &&
    categoryId.length > 0;

  function pickIncomeSource(sourceId: string) {
    const source = incomeSources.find((s) => s.id === sourceId);
    if (!source) return;
    setTitle(source.name);
    setAmount(String(source.amount));
    setFrequency(source.frequency);
  }

  async function doSave() {
    await createTransaction({ accountId, categoryId, title, amount: parsedAmount, transactionType, date, note: null });

    // Sync: auto-create income source if recurring and not yet registered
    if (transactionType === "INCOME" && frequency !== "ONCE") {
      const exists = incomeSources.some(
        (s) => s.name.toLowerCase() === title.trim().toLowerCase(),
      );
      if (!exists) {
        try {
          await incomeSourcesApi.create({ name: title.trim(), amount: parsedAmount, frequency });
          await loadIncomeSources();
        } catch {
          // non-blocking
        }
      }
    }

    navigation.goBack();
  }

  function handleSave() {
    if (!canSubmit) return;
    const duplicate = transactions.find(
      (t) => t.accountId === accountId && t.amount === parsedAmount && t.date === date && t.title.toLowerCase() === title.trim().toLowerCase(),
    );
    if (duplicate) {
      showAlert(
        "Doublon détecté",
        `Une transaction « ${duplicate.title} » de ${parsedAmount} € à la même date existe déjà. Enregistrer quand même ?`,
        [
          { text: "Annuler", style: "cancel" },
          { text: "Enregistrer", onPress: () => void doSave() },
        ],
      );
      return;
    }
    void doSave();
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Nouvelle transaction</Text>
        <Text style={styles.subtitle}>Enregistrez une dépense ou un revenu.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.chips}>
            {types.map(({ value, label }) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                onPress={() => setTransactionType(value)}
                style={[styles.chip, transactionType === value && styles.chipActive]}
              >
                <Text style={[styles.chipText, transactionType === value && styles.chipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Income source quick-pick */}
          {transactionType === "INCOME" && incomeSources.length > 0 && (
            <>
              <Text style={styles.label}>Source existante (optionnel)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipsRow}>
                  {incomeSources.map((s) => (
                    <Pressable
                      key={s.id}
                      style={[styles.chip, styles.sourceChip, title === s.name && styles.chipActive]}
                      onPress={() => pickIncomeSource(s.id)}
                    >
                      <Ionicons
                        name="cash-outline"
                        size={13}
                        color={title === s.name ? t.colors.white : t.colors.primary}
                      />
                      <Text style={[styles.chipText, title === s.name && styles.chipTextActive]}>
                        {s.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          <Text style={styles.label}>Libellé</Text>
          <TextInput
            accessibilityLabel="Libellé"
            onChangeText={setTitle}
            placeholder="Carrefour, Salaire..."
            placeholderTextColor={t.colors.gray500}
            style={styles.input}
            value={title}
          />

          <Text style={styles.label}>Montant</Text>
          <TextInput
            accessibilityLabel="Montant"
            keyboardType="decimal-pad"
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={t.colors.gray500}
            style={styles.input}
            value={amount}
          />

          <Text style={styles.label}>Compte</Text>
          <View style={styles.chips}>
            {accounts.map((a) => (
              <Pressable
                key={a.id}
                accessibilityRole="button"
                onPress={() => setAccountId(a.id)}
                style={[styles.chip, accountId === a.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, accountId === a.id && styles.chipTextActive]}>
                  {a.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Catégorie</Text>
          <View style={styles.chips}>
            {categories.map((c) => (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                onPress={() => setCategoryId(c.id)}
                style={[styles.chip, categoryId === c.id && { backgroundColor: c.color, borderColor: c.color }]}
              >
                <Ionicons
                  name={categoryIcon(c.name) as any}
                  size={13}
                  color={categoryId === c.id ? t.colors.white : c.color}
                />
                <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Frequency — only for income */}
          {transactionType === "INCOME" && (
            <>
              <Text style={styles.label}>Fréquence</Text>
              <View style={styles.chips}>
                {frequencies.map((f) => (
                  <Pressable
                    key={f}
                    accessibilityRole="button"
                    onPress={() => setFrequency(f)}
                    style={[styles.chip, frequency === f && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, frequency === f && styles.chipTextActive]}>
                      {FREQUENCY_LABELS[f]}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {frequency !== "ONCE" && (
                <View style={styles.syncHint}>
                  <Ionicons name="sync-outline" size={13} color={t.colors.primary} />
                  <Text style={styles.syncText}>
                    Cette source sera ajoutée à vos revenus récurrents.
                  </Text>
                </View>
              )}
            </>
          )}

          <Text style={styles.label}>Date</Text>
          <DatePickerButton value={date} onChange={setDate} />
        </View>

        <Pressable
          accessibilityLabel="Enregistrer la transaction"
          accessibilityRole="button"
          disabled={!canSubmit || isLoading}
          onPress={() => handleSave()}
          style={[styles.button, (!canSubmit || isLoading) && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>{isLoading ? "Enregistrement..." : "Enregistrer"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: t.colors.background,
    flexGrow: 1,
    gap: t.spacing.lg,
    padding: t.spacing.xl,
  },
  title: { color: t.colors.foreground, fontSize: 30, fontWeight: "800" },
  subtitle: { color: t.colors.gray600, lineHeight: 21 },
  card: {
    backgroundColor: t.colors.card,
    borderColor: t.colors.border,
    borderRadius: t.radius.xl,
    borderWidth: 1,
    gap: t.spacing.md,
    padding: t.spacing.lg,
    ...t.shadow.card,
  },
  label: { color: t.colors.foreground, fontWeight: "800" },
  input: {
    backgroundColor: t.colors.muted,
    borderColor: t.colors.border,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    color: t.colors.foreground,
    minHeight: 48,
    paddingHorizontal: t.spacing.md,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm },
  chipsRow: { flexDirection: "row", gap: t.spacing.sm },
  chip: {
    alignItems: "center",
    borderColor: t.colors.border,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
  },
  sourceChip: { backgroundColor: t.colors.primaryLight, borderColor: t.colors.primaryLight },
  chipActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  chipText: { color: t.colors.gray700, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: t.colors.white },
  syncHint: {
    alignItems: "center",
    backgroundColor: t.colors.primaryLight,
    borderRadius: t.radius.sm,
    flexDirection: "row",
    gap: t.spacing.xs,
    padding: t.spacing.sm,
  },
  syncText: { color: t.colors.primary, fontSize: 12, flex: 1 },
  button: {
    alignItems: "center",
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.lg,
    justifyContent: "center",
    minHeight: 54,
    ...t.shadow.action,
  },
  buttonDisabled: { backgroundColor: t.colors.gray400, elevation: 0, shadowOpacity: 0 },
  buttonText: { color: t.colors.white, fontWeight: "800" },
});
