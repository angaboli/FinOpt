import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { AccountSummary } from "@/domain/accounts/types";
import { finoptTheme } from "@/presentation/theme/theme";

interface AccountSwitcherProps {
  accounts: AccountSummary[];
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
}

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

export function AccountSwitcher({
  accounts,
  selectedAccountId,
  onSelectAccount,
}: AccountSwitcherProps) {
  return (
    <View>
      <Text style={styles.label}>Comptes</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {accounts.map((account) => {
          const isSelected = account.id === selectedAccountId;

          return (
            <Pressable
              accessibilityLabel={`Compte ${account.name}`}
              accessibilityRole="button"
              key={account.id}
              onPress={() => onSelectAccount(account.id)}
              style={[styles.card, isSelected && styles.cardSelected]}
            >
              <View style={[styles.dot, { backgroundColor: account.color }]} />
              <Text style={styles.name}>{account.name}</Text>
              <Text style={styles.type}>{account.accountType}</Text>
              <Text style={[styles.balance, account.balance < 0 && styles.balanceNegative]}>
                {currencyFormatter.format(account.balance)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: finoptTheme.colors.gray700,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: finoptTheme.spacing.sm,
  },
  list: {
    gap: finoptTheme.spacing.md,
    paddingRight: finoptTheme.spacing.xl,
  },
  card: {
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.lg,
    borderWidth: 1,
    minHeight: 112,
    padding: finoptTheme.spacing.md,
    width: 168,
  },
  cardSelected: {
    borderColor: finoptTheme.colors.primary,
    borderWidth: 2,
  },
  dot: {
    borderRadius: 6,
    height: 12,
    marginBottom: finoptTheme.spacing.sm,
    width: 12,
  },
  name: {
    color: finoptTheme.colors.foreground,
    fontSize: 15,
    fontWeight: "800",
  },
  type: {
    color: finoptTheme.colors.gray600,
    fontSize: 12,
    marginTop: 2,
  },
  balance: {
    color: finoptTheme.colors.foreground,
    fontSize: 16,
    fontWeight: "800",
    marginTop: "auto",
  },
  balanceNegative: {
    color: finoptTheme.colors.danger,
  },
});
