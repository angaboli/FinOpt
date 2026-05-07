import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../../App";
import { useAccountsStore } from "@/application/accounts/accountsStore";
import { useCategoriesStore } from "@/application/categories/categoriesStore";
import { useTransactionsStore } from "@/application/transactions/transactionsStore";
import type { TransactionType } from "@/domain/transactions/types";
import { DatePickerButton } from "@/presentation/components/DatePickerButton";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "EditTransaction">;

const t = finoptTheme;
const types: Array<{ value: TransactionType; label: string }> = [
  { value: "EXPENSE", label: "Dépense" },
  { value: "INCOME", label: "Revenu" },
];

export function EditTransactionScreen({ route, navigation }: Props) {
  const { transactionId } = route.params;

  const transactions = useTransactionsStore((s) => s.transactions);
  const updateTransaction = useTransactionsStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionsStore((s) => s.deleteTransaction);
  const isLoading = useTransactionsStore((s) => s.isLoading);
  const accounts = useAccountsStore((s) => s.accounts);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.loadCategories);

  const tx = transactions.find((t) => t.id === transactionId);
  const account = accounts.find((a) => a.id === tx?.accountId);

  const [title, setTitle] = useState(tx?.title ?? "");
  const [amount, setAmount] = useState(tx ? String(tx.amount) : "");
  const [transactionType, setTransactionType] = useState<TransactionType>(tx?.transactionType ?? "EXPENSE");
  const [categoryId, setCategoryId] = useState(tx?.categoryId ?? "");
  const [date, setDate] = useState(tx?.date ?? "");
  const [note, setNote] = useState(tx?.note ?? "");

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  if (!tx) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Transaction introuvable.</Text>
      </View>
    );
  }

  const parsedAmount = Number(amount.replace(",", ".") || "0");
  const canSave = title.trim().length > 0 && parsedAmount > 0 && categoryId.length > 0;

  async function handleSave() {
    if (!canSave) return;
    await updateTransaction(transactionId, {
      categoryId,
      title: title.trim(),
      amount: parsedAmount,
      transactionType,
      date,
      note: note.trim() || null,
    });
    navigation.goBack();
  }

  function handleDelete() {
    Alert.alert(
      "Supprimer la transaction",
      `Supprimer "${tx!.title}" (${tx!.amount} €) ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteTransaction(transactionId);
            navigation.goBack();
          },
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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

          {account && (
            <>
              <Text style={styles.label}>Compte</Text>
              <View style={styles.accountBadge}>
                <View style={[styles.accountDot, { backgroundColor: account.color }]} />
                <Text style={styles.accountName}>{account.name}</Text>
              </View>
            </>
          )}

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
          <DatePickerButton value={date} onChange={setDate} />

          <Text style={styles.label}>Note (optionnel)</Text>
          <TextInput
            accessibilityLabel="Note"
            multiline
            numberOfLines={2}
            onChangeText={setNote}
            placeholder="Détails supplémentaires..."
            placeholderTextColor={t.colors.gray500}
            style={[styles.input, styles.inputMultiline]}
            value={note}
          />
        </View>

        <Pressable
          accessibilityLabel="Enregistrer les modifications"
          accessibilityRole="button"
          disabled={!canSave || isLoading}
          onPress={() => void handleSave()}
          style={[styles.button, (!canSave || isLoading) && styles.buttonDisabled]}
        >
          <Ionicons name="checkmark" size={18} color={t.colors.white} />
          <Text style={styles.buttonText}>{isLoading ? "Enregistrement..." : "Enregistrer"}</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Supprimer la transaction"
          accessibilityRole="button"
          onPress={handleDelete}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={18} color={t.colors.danger} />
          <Text style={styles.deleteText}>Supprimer</Text>
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
    paddingBottom: 40,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { color: t.colors.gray600 },
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
  inputMultiline: { minHeight: 72, paddingTop: t.spacing.sm, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm },
  chip: {
    borderColor: t.colors.border,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
  },
  chipActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  chipText: { color: t.colors.gray700, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: t.colors.white },
  accountBadge: {
    alignItems: "center",
    backgroundColor: t.colors.muted,
    borderColor: t.colors.border,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: t.spacing.sm,
    minHeight: 48,
    paddingHorizontal: t.spacing.md,
  },
  accountDot: { width: 10, height: 10, borderRadius: 5 },
  accountName: { color: t.colors.foreground, fontWeight: "600" },
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
  buttonDisabled: { backgroundColor: t.colors.gray400, elevation: 0, shadowOpacity: 0 },
  buttonText: { color: t.colors.white, fontWeight: "800" },
  deleteButton: {
    alignItems: "center",
    backgroundColor: t.colors.card,
    borderColor: t.colors.danger,
    borderRadius: t.radius.lg,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: t.spacing.sm,
    justifyContent: "center",
    minHeight: 48,
  },
  deleteText: { color: t.colors.danger, fontWeight: "700" },
});
