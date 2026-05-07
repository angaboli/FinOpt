import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { showAlert } from "@/application/alert/alertStore";
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
          <View style={styles.heroTop}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.title}>Comptes</Text>
              <Text style={styles.subtitle}>Gérez vos comptes courants, épargnes et partagés.</Text>
            </View>
            <Pressable
              accessibilityLabel="Ajouter un compte"
              accessibilityRole="button"
              onPress={() => navigation.navigate("AddAccount")}
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.addBtnText}>+ Ajouter</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityLabel="Faire un virement"
            accessibilityRole="button"
            onPress={() => navigation.navigate("Transfer")}
            style={({ pressed }) => [styles.transferBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="swap-horizontal" size={15} color={finoptTheme.colors.primary} />
            <Text style={styles.transferBtnText}>Virement entre comptes</Text>
          </Pressable>
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
              <View style={styles.cardActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => navigation.navigate("EditAccount", { accountId: account.id })}
                >
                  <Text style={styles.edit}>Modifier</Text>
                </Pressable>
                <Text style={styles.separator}>·</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    showAlert(
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
          </View>
        ))}

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
  hero: { gap: finoptTheme.spacing.sm },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  heroTextBlock: { flex: 1, paddingRight: finoptTheme.spacing.md },
  addBtn: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.primary,
    borderRadius: finoptTheme.radius.lg,
    justifyContent: "center",
    paddingHorizontal: finoptTheme.spacing.lg,
    paddingVertical: finoptTheme.spacing.sm,
    ...finoptTheme.shadow.action,
  },
  addBtnText: { color: finoptTheme.colors.white, fontWeight: "800", fontSize: 13 },
  transferBtn: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.primary,
    borderRadius: finoptTheme.radius.lg,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: finoptTheme.spacing.xs,
    paddingHorizontal: finoptTheme.spacing.md,
    paddingVertical: finoptTheme.spacing.xs,
  },
  transferBtnText: { color: finoptTheme.colors.primary, fontWeight: "700", fontSize: 13 },
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
  cardActions: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: finoptTheme.spacing.sm },
  edit: { color: finoptTheme.colors.primary, fontSize: 12, fontWeight: "700" },
  separator: { color: finoptTheme.colors.gray400, fontSize: 12 },
  delete: { color: finoptTheme.colors.danger, fontSize: 12, fontWeight: "700" },
});
