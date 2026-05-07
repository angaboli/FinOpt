import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { useAccountsStore } from "@/application/accounts/accountsStore";
import { useCategoriesStore } from "@/application/categories/categoriesStore";
import { useTransactionsStore } from "@/application/transactions/transactionsStore";
import type { TransactionType } from "@/domain/transactions/types";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "AddTransaction">;

const types: Array<{ value: TransactionType; label: string }> = [
  { value: "EXPENSE", label: "Dépense" },
  { value: "INCOME", label: "Revenu" },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddTransactionScreen({ navigation }: Props) {
  const accounts = useAccountsStore((s) => s.accounts);
  const selectedAccountId = useAccountsStore((s) => s.selectedAccountId);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.loadCategories);
  const createTransaction = useTransactionsStore((s) => s.createTransaction);
  const isLoading = useTransactionsStore((s) => s.isLoading);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState<TransactionType>("EXPENSE");
  const [accountId, setAccountId] = useState(selectedAccountId ?? accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayIso());

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const parsedAmount = Number(amount.replace(",", ".") || "0");
  const canSubmit =
    title.trim().length > 0 &&
    parsedAmount > 0 &&
    accountId.length > 0 &&
    categoryId.length > 0;

  async function handleSave() {
    if (!canSubmit) return;
    await createTransaction({
      accountId,
      categoryId,
      title,
      amount: parsedAmount,
      transactionType,
      date,
      note: null,
    });
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

        <Text style={styles.label}>Libellé</Text>
        <TextInput
          accessibilityLabel="Libellé"
          onChangeText={setTitle}
          placeholder="Carrefour, Salaire..."
          placeholderTextColor={finoptTheme.colors.gray500}
          style={styles.input}
          value={title}
        />

        <Text style={styles.label}>Montant</Text>
        <TextInput
          accessibilityLabel="Montant"
          keyboardType="decimal-pad"
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={finoptTheme.colors.gray500}
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
              style={[
                styles.chip,
                categoryId === c.id && { backgroundColor: c.color, borderColor: c.color },
              ]}
            >
              <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Date</Text>
        <TextInput
          accessibilityLabel="Date"
          onChangeText={setDate}
          placeholder="AAAA-MM-JJ"
          placeholderTextColor={finoptTheme.colors.gray500}
          style={styles.input}
          value={date}
        />
      </View>

      <Pressable
        accessibilityLabel="Enregistrer la transaction"
        accessibilityRole="button"
        disabled={!canSubmit || isLoading}
        onPress={handleSave}
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
    backgroundColor: finoptTheme.colors.background,
    flexGrow: 1,
    gap: finoptTheme.spacing.lg,
    padding: finoptTheme.spacing.xl,
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: finoptTheme.spacing.sm },
  chip: {
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: finoptTheme.spacing.md,
    paddingVertical: finoptTheme.spacing.sm,
  },
  chipActive: { backgroundColor: finoptTheme.colors.primary, borderColor: finoptTheme.colors.primary },
  chipText: { color: finoptTheme.colors.gray700, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: finoptTheme.colors.white },
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
