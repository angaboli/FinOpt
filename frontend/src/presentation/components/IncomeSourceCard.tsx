import { Pressable, StyleSheet, Text, View } from "react-native";

import type { IncomeSource } from "@/domain/income_sources/types";
import { FREQUENCY_LABELS } from "@/domain/income_sources/types";
import { finoptTheme } from "@/presentation/theme/theme";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  currency: "EUR",
  style: "currency",
});

interface IncomeSourceCardProps {
  source: IncomeSource;
  onDelete?: (id: string) => void;
}

export function IncomeSourceCard({ source, onDelete }: IncomeSourceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.name}>{source.name}</Text>
        <Text style={styles.frequency}>{FREQUENCY_LABELS[source.frequency]}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{currencyFormatter.format(source.amount)}</Text>
        {onDelete ? (
          <Pressable
            accessibilityLabel={`Supprimer ${source.name}`}
            accessibilityRole="button"
            onPress={() => onDelete(source.id)}
          >
            <Text style={styles.delete}>Supprimer</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: finoptTheme.spacing.lg,
    ...finoptTheme.shadow.card,
  },
  left: {
    flex: 1,
    gap: finoptTheme.spacing.xs,
  },
  name: {
    color: finoptTheme.colors.foreground,
    fontSize: 15,
    fontWeight: "800",
  },
  frequency: {
    color: finoptTheme.colors.gray600,
    fontSize: 12,
  },
  right: {
    alignItems: "flex-end",
    gap: finoptTheme.spacing.xs,
  },
  amount: {
    color: finoptTheme.colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  delete: {
    color: finoptTheme.colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
});
