import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { useAccountsStore } from "@/application/accounts/accountsStore";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Accounts">;

const formatter = new Intl.NumberFormat("fr-FR", {
  currency: "EUR",
  style: "currency",
});

export function AccountsScreen({ navigation }: Props) {
  const accounts = useAccountsStore((state) => state.accounts);
  const deleteAccount = useAccountsStore((state) => state.deleteAccount);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>Comptes</Text>
          <Text style={styles.subtitle}>Pilotez vos comptes courants, epargnes et comptes partages.</Text>
        </View>

        {accounts.map((account) => (
          <View key={account.id} style={styles.card}>
            <View style={[styles.colorDot, { backgroundColor: account.color }]} />
            <View style={styles.cardContent}>
              <Text style={styles.accountName}>{account.name}</Text>
              <Text style={styles.accountType}>{account.accountType}</Text>
            </View>
            <View style={styles.amountBlock}>
              <Text style={[styles.amount, account.balance < 0 && styles.amountNegative]}>
                {formatter.format(account.balance)}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  Alert.alert(
                    "Supprimer le compte",
                    `Supprimer « ${account.name} » ? Cette action est irréversible.`,
                    [
                      { text: "Annuler", style: "cancel" },
                      { text: "Supprimer", style: "destructive", onPress: () => deleteAccount(account.id) },
                    ],
                  )
                }
              >
                <Text style={styles.delete}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Faire un virement"
            accessibilityRole="button"
            onPress={() => navigation.navigate("Transfer")}
            style={({ pressed }) => [styles.button, styles.buttonSecondary, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="swap-horizontal" size={18} color={finoptTheme.colors.primary} />
            <Text style={styles.buttonTextSecondary}>Virement</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Ajouter un compte"
            accessibilityRole="button"
            onPress={() => navigation.navigate("AddAccount")}
            style={({ pressed }) => [styles.button, styles.buttonFlex, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Ajouter un compte</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: finoptTheme.colors.background,
    flex: 1,
  },
  content: {
    gap: finoptTheme.spacing.lg,
    padding: finoptTheme.spacing.xl,
  },
  hero: {
    gap: finoptTheme.spacing.xs,
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
    alignItems: "center",
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: finoptTheme.spacing.md,
    padding: finoptTheme.spacing.lg,
    ...finoptTheme.shadow.card,
  },
  colorDot: {
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  cardContent: {
    flex: 1,
  },
  accountName: {
    color: finoptTheme.colors.foreground,
    fontSize: 16,
    fontWeight: "800",
  },
  accountType: {
    color: finoptTheme.colors.gray600,
    fontSize: 12,
    marginTop: 2,
  },
  amountBlock: {
    alignItems: "flex-end",
  },
  amount: {
    color: finoptTheme.colors.foreground,
    fontSize: 15,
    fontWeight: "800",
  },
  amountNegative: {
    color: finoptTheme.colors.danger,
  },
  delete: {
    color: finoptTheme.colors.danger,
    fontSize: 12,
    fontWeight: "700",
    marginTop: finoptTheme.spacing.sm,
  },
  actions: { flexDirection: "row", gap: finoptTheme.spacing.sm },
  button: {
    alignItems: "center",
    borderRadius: finoptTheme.radius.lg,
    flexDirection: "row",
    gap: finoptTheme.spacing.sm,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: finoptTheme.spacing.lg,
  },
  buttonFlex: {
    flex: 1,
    backgroundColor: finoptTheme.colors.primary,
    ...finoptTheme.shadow.action,
  },
  buttonSecondary: {
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.primary,
    borderWidth: 1.5,
  },
  buttonPressed: { backgroundColor: finoptTheme.colors.primaryDark },
  buttonText: { color: finoptTheme.colors.white, fontWeight: "800" },
  buttonTextSecondary: { color: finoptTheme.colors.primary, fontWeight: "700" },
});
