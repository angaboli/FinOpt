import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { useAccountsStore } from "@/application/accounts/accountsStore";
import type { AccountType } from "@/domain/accounts/types";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "AddAccount">;

const accountTypes: AccountType[] = ["CURRENT", "SAVINGS", "JOINT", "INVESTMENT", "CASH"];
const colors = [
  finoptTheme.colors.primary,
  finoptTheme.colors.secondary,
  finoptTheme.colors.orange,
  finoptTheme.colors.warning,
  finoptTheme.colors.purple,
];

export function AddAccountScreen({ navigation }: Props) {
  const createAccount = useAccountsStore((state) => state.createAccount);
  const isLoading = useAccountsStore((state) => state.isLoading);
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("CURRENT");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState(colors[0]);
  const canSubmit = name.trim().length > 0 && !Number.isNaN(Number(balance || "0"));

  async function handleSave() {
    if (!canSubmit) {
      return;
    }
    await createAccount({
      name,
      accountType,
      balance: Number(balance || "0"),
      currency: "EUR",
      color,
    });
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Nouveau compte</Text>
        <Text style={styles.subtitle}>Ajoutez un compte bancaire, épargne ou compte partagé.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            accessibilityLabel="Nom du compte"
            onChangeText={setName}
            placeholder="Compte Courant"
            placeholderTextColor={finoptTheme.colors.gray500}
            style={styles.input}
            value={name}
          />

          <Text style={styles.label}>Type</Text>
          <View style={styles.chips}>
            {accountTypes.map((type) => (
              <Pressable
                accessibilityRole="button"
                key={type}
                onPress={() => setAccountType(type)}
                style={[styles.chip, accountType === type && styles.chipActive]}
              >
                <Text style={[styles.chipText, accountType === type && styles.chipTextActive]}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Solde initial</Text>
          <TextInput
            accessibilityLabel="Solde initial"
            keyboardType="numbers-and-punctuation"
            onChangeText={setBalance}
            placeholder="0.00 (négatif si découvert)"
            placeholderTextColor={finoptTheme.colors.gray500}
            style={styles.input}
            value={balance}
          />

          <Text style={styles.label}>Couleur</Text>
          <View style={styles.colors}>
            {colors.map((item) => (
              <Pressable
                accessibilityRole="button"
                key={item}
                onPress={() => setColor(item)}
                style={[
                  styles.colorChoice,
                  { backgroundColor: item },
                  color === item && styles.colorChoiceActive,
                ]}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityLabel="Enregistrer le compte"
          accessibilityRole="button"
          disabled={!canSubmit || isLoading}
          onPress={handleSave}
          style={[styles.button, (!canSubmit || isLoading) && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>{isLoading ? "Enregistrement..." : "Créer le compte"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: finoptTheme.colors.background,
    flexGrow: 1,
    gap: finoptTheme.spacing.lg,
    padding: finoptTheme.spacing.xl,
    paddingBottom: finoptTheme.spacing.lg,
  },
  footer: {
    backgroundColor: finoptTheme.colors.background,
    borderTopColor: finoptTheme.colors.border,
    borderTopWidth: 1,
    padding: finoptTheme.spacing.xl,
    paddingBottom: finoptTheme.spacing.xl,
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
    fontWeight: "800",
  },
  chipTextActive: {
    color: finoptTheme.colors.white,
  },
  colors: {
    flexDirection: "row",
    gap: finoptTheme.spacing.md,
  },
  colorChoice: {
    borderColor: finoptTheme.colors.white,
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    width: 36,
  },
  colorChoiceActive: {
    borderColor: finoptTheme.colors.foreground,
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
