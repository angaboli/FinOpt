import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../../App";
import { showAlert } from "@/application/alert/alertStore";
import { useAccountsStore } from "@/application/accounts/accountsStore";
import { useCategoriesStore } from "@/application/categories/categoriesStore";
import { useTransactionsStore } from "@/application/transactions/transactionsStore";
import { categoryIcon } from "@/domain/categories/categoryIcons";
import { DatePickerButton } from "@/presentation/components/DatePickerButton";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Transfer">;

const t = finoptTheme;
const fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TransferScreen({ navigation }: Props) {
  const accounts = useAccountsStore((s) => s.accounts);
  const selectedAccountId = useAccountsStore((s) => s.selectedAccountId);
  const loadAccounts = useAccountsStore((s) => s.loadAccounts);
  const categories = useCategoriesStore((s) => s.categories);
  const loadTransactions = useTransactionsStore((s) => s.loadTransactions);

  const [fromAccountId, setFromAccountId] = useState(selectedAccountId ?? accounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(
    accounts.find((a) => a.id !== fromAccountId)?.id ?? "",
  );
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const parsedAmount = Number(amount.replace(",", ".") || "0");
  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);
  const canSave =
    fromAccountId &&
    toAccountId &&
    fromAccountId !== toAccountId &&
    parsedAmount > 0 &&
    categoryId;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const { transactionsApi } = await import("@/infrastructure/api/transactionsApi");
      await transactionsApi.transfer({
        fromAccountId,
        toAccountId,
        categoryId,
        amount: parsedAmount,
        date,
        note: note.trim() || null,
      });
      await Promise.all([loadTransactions(), loadAccounts()]);
      showAlert(
        "Virement effectué",
        `${fmt.format(parsedAmount)} transféré de « ${fromAccount?.name} » vers « ${toAccount?.name} ».`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch {
      showAlert("Erreur", "Le virement a échoué. Vérifiez votre connexion.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Virement</Text>
        <Text style={styles.subtitle}>Transférez de l'argent entre vos comptes.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Compte source</Text>
          <View style={styles.chips}>
            {accounts.map((a) => (
              <Pressable
                key={a.id}
                style={[styles.chip, fromAccountId === a.id && styles.chipActive]}
                onPress={() => {
                  setFromAccountId(a.id);
                  if (toAccountId === a.id) {
                    setToAccountId(accounts.find((x) => x.id !== a.id)?.id ?? "");
                  }
                }}
              >
                <View style={[styles.chipDot, { backgroundColor: a.color }]} />
                <Text style={[styles.chipText, fromAccountId === a.id && styles.chipTextActive]}>
                  {a.name}
                </Text>
              </Pressable>
            ))}
          </View>
          {fromAccount && (
            <Text style={styles.balance}>Solde : {fmt.format(fromAccount.balance)}</Text>
          )}

          <View style={styles.arrowRow}>
            <View style={styles.dividerLine} />
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-down" size={18} color={t.colors.primary} />
            </View>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.label}>Compte destinataire</Text>
          <View style={styles.chips}>
            {accounts
              .filter((a) => a.id !== fromAccountId)
              .map((a) => (
                <Pressable
                  key={a.id}
                  style={[styles.chip, toAccountId === a.id && styles.chipActive]}
                  onPress={() => setToAccountId(a.id)}
                >
                  <View style={[styles.chipDot, { backgroundColor: a.color }]} />
                  <Text style={[styles.chipText, toAccountId === a.id && styles.chipTextActive]}>
                    {a.name}
                  </Text>
                </Pressable>
              ))}
          </View>
          {toAccount && (
            <Text style={styles.balance}>Solde : {fmt.format(toAccount.balance)}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Montant</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={t.colors.gray500}
            style={styles.input}
            value={amount}
          />

          <Text style={styles.label}>Catégorie</Text>
          <View style={styles.chips}>
            {categories.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.chip, categoryId === c.id && { backgroundColor: c.color, borderColor: c.color }]}
                onPress={() => setCategoryId(c.id)}
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

          <Text style={styles.label}>Date</Text>
          <DatePickerButton value={date} onChange={setDate} />

          <Text style={styles.label}>Note (optionnel)</Text>
          <TextInput
            multiline
            numberOfLines={2}
            onChangeText={setNote}
            placeholder="Loyer, remboursement..."
            placeholderTextColor={t.colors.gray500}
            style={[styles.input, styles.inputMultiline]}
            value={note}
          />
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          disabled={!canSave || isSaving}
          onPress={() => void handleSave()}
          style={[styles.button, (!canSave || isSaving) && styles.buttonDisabled]}
        >
          {isSaving ? (
            <ActivityIndicator color={t.colors.white} />
          ) : (
            <>
              <Ionicons name="swap-horizontal" size={20} color={t.colors.white} />
              <Text style={styles.buttonText}>Confirmer le virement</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: t.colors.background,
    flexGrow: 1,
    gap: t.spacing.lg,
    padding: t.spacing.xl,
    paddingBottom: t.spacing.lg,
  },
  footer: {
    backgroundColor: t.colors.background,
    borderTopColor: t.colors.border,
    borderTopWidth: 1,
    padding: t.spacing.xl,
  },
  title: { color: t.colors.foreground, fontSize: 28, fontWeight: "800" },
  subtitle: { color: t.colors.gray600, lineHeight: 20 },
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm },
  chip: {
    alignItems: "center",
    borderColor: t.colors.border,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    backgroundColor: t.colors.muted,
  },
  chipDot: { width: 10, height: 10, borderRadius: 5 },
  chipActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  chipText: { color: t.colors.gray700, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: t.colors.white },
  balance: { color: t.colors.gray600, fontSize: 12 },
  arrowRow: { alignItems: "center", flexDirection: "row", gap: t.spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: t.colors.border },
  arrowCircle: {
    alignItems: "center",
    backgroundColor: t.colors.primaryLight,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
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
});
