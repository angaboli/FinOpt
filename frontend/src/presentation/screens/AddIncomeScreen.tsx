import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { useIncomeSourcesStore } from "@/application/income_sources/incomeSourcesStore";
import type { Frequency } from "@/domain/income_sources/types";
import { FREQUENCY_LABELS } from "@/domain/income_sources/types";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "AddIncome">;

const frequencies: Frequency[] = ["MONTHLY", "WEEKLY", "BIWEEKLY", "QUARTERLY", "ANNUAL", "ONCE"];

export function AddIncomeScreen({ navigation }: Props) {
  const createIncomeSource = useIncomeSourcesStore((state) => state.createIncomeSource);
  const isLoading = useIncomeSourcesStore((state) => state.isLoading);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("MONTHLY");

  const parsedAmount = Number(amount.replace(",", ".") || "0");
  const canSubmit = name.trim().length > 0 && !Number.isNaN(parsedAmount) && parsedAmount >= 0;

  async function handleSave() {
    if (!canSubmit) return;
    await createIncomeSource({ name, amount: parsedAmount, frequency });
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
      <Text style={styles.title}>Nouveau revenu</Text>
      <Text style={styles.subtitle}>Déclarez une source de revenu régulière ou ponctuelle.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nom</Text>
        <TextInput
          accessibilityLabel="Nom du revenu"
          onChangeText={setName}
          placeholder="Salaire, Freelance, Loyer..."
          placeholderTextColor={finoptTheme.colors.gray500}
          style={styles.input}
          value={name}
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

        <Text style={styles.label}>Fréquence</Text>
        <View style={styles.chips}>
          {frequencies.map((freq) => (
            <Pressable
              accessibilityRole="button"
              key={freq}
              onPress={() => setFrequency(freq)}
              style={[styles.chip, frequency === freq && styles.chipActive]}
            >
              <Text style={[styles.chipText, frequency === freq && styles.chipTextActive]}>
                {FREQUENCY_LABELS[freq]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        accessibilityLabel="Enregistrer le revenu"
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
  title: {
    color: finoptTheme.colors.foreground,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: finoptTheme.colors.gray600,
    lineHeight: 21,
  },
  card: {
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1,
    gap: finoptTheme.spacing.md,
    padding: finoptTheme.spacing.lg,
    ...finoptTheme.shadow.card,
  },
  label: {
    color: finoptTheme.colors.foreground,
    fontWeight: "800",
  },
  input: {
    backgroundColor: finoptTheme.colors.muted,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.sm,
    borderWidth: 1,
    color: finoptTheme.colors.foreground,
    minHeight: 48,
    paddingHorizontal: finoptTheme.spacing.md,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: finoptTheme.spacing.sm,
  },
  chip: {
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: finoptTheme.spacing.md,
    paddingVertical: finoptTheme.spacing.sm,
  },
  chipActive: {
    backgroundColor: finoptTheme.colors.primary,
    borderColor: finoptTheme.colors.primary,
  },
  chipText: {
    color: finoptTheme.colors.gray700,
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextActive: {
    color: finoptTheme.colors.white,
  },
  button: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.primary,
    borderRadius: finoptTheme.radius.lg,
    justifyContent: "center",
    minHeight: 54,
    ...finoptTheme.shadow.action,
  },
  buttonDisabled: {
    backgroundColor: finoptTheme.colors.gray400,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    color: finoptTheme.colors.white,
    fontWeight: "800",
  },
});
