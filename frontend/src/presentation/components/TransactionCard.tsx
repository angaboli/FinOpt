import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { categoryIcon } from "@/domain/categories/categoryIcons";
import type { TransactionSummary } from "@/domain/transactions/types";
import { finoptTheme } from "@/presentation/theme/theme";

interface TransactionCardProps {
  transaction: TransactionSummary;
}

const amountFormatter = new Intl.NumberFormat("fr-FR", {
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

export function TransactionCard({ transaction }: TransactionCardProps) {
  const amountColor =
    transaction.type === "income" ? finoptTheme.colors.primary : finoptTheme.colors.danger;
  const signedAmount =
    transaction.type === "income"
      ? `+${amountFormatter.format(transaction.amount)}`
      : amountFormatter.format(transaction.amount);

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: transaction.categoryColor }]}>
        <Ionicons
          name={categoryIcon(transaction.category) as any}
          size={18}
          color={finoptTheme.colors.white}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{transaction.title}</Text>
          {transaction.isSubscription && (
            <View style={styles.subBadge}>
              <Ionicons name="repeat" size={10} color={finoptTheme.colors.primary} />
              <Text style={styles.subBadgeText}>ABN</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>
          {transaction.category} · {transaction.accountName}
        </Text>
      </View>
      <View style={styles.amountBlock}>
        <Text style={[styles.amount, { color: amountColor }]}>{signedAmount}</Text>
        <Text style={styles.date}>{transaction.date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: finoptTheme.spacing.md,
    minHeight: 58,
  },
  icon: {
    alignItems: "center",
    borderRadius: finoptTheme.radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  content: {
    flex: 1,
    overflow: "hidden",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  title: {
    color: finoptTheme.colors.foreground,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
  subBadge: {
    alignItems: "center",
    backgroundColor: "#FCE7F3",
    borderColor: "#EC4899",
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: "row",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  subBadgeText: {
    color: "#EC4899",
    fontSize: 9,
    fontWeight: "800",
  },
  meta: {
    color: finoptTheme.colors.gray600,
    fontSize: 12,
    marginTop: 2,
  },
  amountBlock: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 14,
    fontWeight: "800",
  },
  date: {
    color: finoptTheme.colors.gray500,
    fontSize: 11,
    marginTop: 2,
  },
});
