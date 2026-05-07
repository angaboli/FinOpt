import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { RootStackParamList } from "../../../App";
import { useAccountsStore } from "@/application/accounts/accountsStore";
import type { AccountType } from "@/domain/accounts/types";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "EditAccount">;

const accountTypes: AccountType[] = ["CURRENT", "SAVINGS", "JOINT", "INVESTMENT", "CASH"];
const colors = [
  finoptTheme.colors.primary,
  finoptTheme.colors.secondary,
  finoptTheme.colors.orange,
  finoptTheme.colors.warning,
  finoptTheme.colors.purple,
];
const t = finoptTheme;

export function EditAccountScreen({ route, navigation }: Props) {
  const { accountId } = route.params;
  const accounts = useAccountsStore((s) => s.accounts);
  const updateAccount = useAccountsStore((s) => s.updateAccount);
  const isLoading = useAccountsStore((s) => s.isLoading);

  const account = accounts.find((a) => a.id === accountId);

  const [name, setName] = useState(account?.name ?? "");
  const [accountType, setAccountType] = useState<AccountType>(account?.accountType ?? "CURRENT");
  const [balance, setBalance] = useState(account ? String(account.balance) : "");
  const [color, setColor] = useState(account?.color ?? colors[0]);

  if (!account) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Compte introuvable.</Text>
      </View>
    );
  }

  const canSave = name.trim().length > 0 && !Number.isNaN(Number(balance || "0"));

  async function handleSave() {
    if (!canSave) return;
    await updateAccount(accountId, {
      name: name.trim(),
      accountType,
      balance: Number(balance || "0"),
      currency: account!.currency,
      color,
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
        <View style={styles.card}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            accessibilityLabel="Nom du compte"
            onChangeText={setName}
            placeholder="Compte Courant"
            placeholderTextColor={t.colors.gray500}
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

          <Text style={styles.label}>Solde</Text>
          <TextInput
            accessibilityLabel="Solde"
            keyboardType="numbers-and-punctuation"
            onChangeText={setBalance}
            placeholder="0.00"
            placeholderTextColor={t.colors.gray500}
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

        <Pressable
          accessibilityLabel="Enregistrer les modifications"
          accessibilityRole="button"
          disabled={!canSave || isLoading}
          onPress={() => void handleSave()}
          style={[styles.button, (!canSave || isLoading) && styles.buttonDisabled]}
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
    paddingBottom: t.spacing.xxl,
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm },
  chip: {
    borderColor: t.colors.border,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
  },
  chipActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  chipText: { color: t.colors.gray700, fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: t.colors.white },
  colors: { flexDirection: "row", gap: t.spacing.md },
  colorChoice: {
    borderColor: t.colors.white,
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    width: 36,
  },
  colorChoiceActive: { borderColor: t.colors.foreground },
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
