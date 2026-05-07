import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useBudgetsStore } from "@/application/budgets/budgetsStore";
import { useCategoriesStore } from "@/application/categories/categoriesStore";
import type { BudgetLine } from "@/domain/budgets/types";
import type { RootStackParamList } from "../../../App";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "SetBudget">;

export function SetBudgetScreen({ navigation }: Props) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const budget = useBudgetsStore((s) => s.budget);
  const saveBudget = useBudgetsStore((s) => s.saveBudget);
  const isLoading = useBudgetsStore((s) => s.isLoading);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.loadCategories);

  const [amounts, setAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (budget) {
      const initial: Record<string, string> = {};
      for (const line of budget.lines) {
        initial[line.categoryId] = String(line.plannedAmount);
      }
      setAmounts(initial);
    }
  }, [budget]);

  async function handleSave() {
    const lines: BudgetLine[] = categories
      .filter((c) => amounts[c.id] && Number(amounts[c.id]) > 0)
      .map((c) => ({ categoryId: c.id, plannedAmount: Number(amounts[c.id]) }));
    await saveBudget(year, month, lines);
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.subtitle}>
        Définissez un montant maximum par catégorie pour ce mois
      </Text>

      {categories.map((cat) => (
        <View key={cat.id} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: cat.color }]} />
          <Text style={styles.catName}>{cat.name}</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="0"
            value={amounts[cat.id] ?? ""}
            onChangeText={(v) => setAmounts((prev) => ({ ...prev, [cat.id]: v }))}
            accessibilityLabel={`Budget ${cat.name}`}
          />
          <Text style={styles.currency}>€</Text>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isLoading}
        accessibilityLabel="Enregistrer le budget"
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: finoptTheme.colors.background },
  content: { padding: finoptTheme.spacing.lg, gap: finoptTheme.spacing.md },
  subtitle: { fontSize: 14, color: finoptTheme.colors.gray600, marginBottom: finoptTheme.spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: finoptTheme.spacing.sm,
    backgroundColor: finoptTheme.colors.card,
    borderRadius: finoptTheme.radius.lg,
    padding: finoptTheme.spacing.md,
    ...finoptTheme.shadow.card,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  catName: { flex: 1, fontSize: 14, fontWeight: "600", color: finoptTheme.colors.foreground },
  input: {
    width: 80,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "700",
    color: finoptTheme.colors.foreground,
    borderBottomWidth: 1,
    borderBottomColor: finoptTheme.colors.border,
    paddingVertical: 2,
  },
  currency: { fontSize: 14, color: finoptTheme.colors.gray600 },
  saveButton: {
    backgroundColor: finoptTheme.colors.primary,
    borderRadius: finoptTheme.radius.xl,
    paddingVertical: finoptTheme.spacing.lg,
    alignItems: "center",
    marginTop: finoptTheme.spacing.lg,
    ...finoptTheme.shadow.action,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
