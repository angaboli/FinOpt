import { Pressable, StyleSheet, Text, View } from "react-native";

import { finoptTheme } from "@/presentation/theme/theme";

export type BottomTab = "home" | "transactions" | "conseils" | "profil";

interface BottomNavProps {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
}

const tabs: Array<{ id: BottomTab; label: string }> = [
  { id: "home", label: "Accueil" },
  { id: "transactions", label: "Flux" },
  { id: "conseils", label: "Conseils" },
  { id: "profil", label: "Profil" },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <Pressable
            accessibilityLabel={tab.label}
            accessibilityRole="button"
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={styles.item}
          >
            <View style={[styles.indicator, isActive && styles.indicatorActive]} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: finoptTheme.colors.card,
    borderColor: finoptTheme.colors.border,
    borderRadius: finoptTheme.radius.xl,
    borderWidth: 1,
    bottom: finoptTheme.spacing.lg,
    flexDirection: "row",
    gap: finoptTheme.spacing.sm,
    justifyContent: "space-between",
    left: finoptTheme.spacing.lg,
    padding: finoptTheme.spacing.sm,
    position: "absolute",
    right: finoptTheme.spacing.lg,
    ...finoptTheme.shadow.card,
  },
  item: {
    alignItems: "center",
    flex: 1,
    gap: finoptTheme.spacing.xs,
    minHeight: 48,
    justifyContent: "center",
  },
  indicator: {
    backgroundColor: "transparent",
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  indicatorActive: {
    backgroundColor: finoptTheme.colors.primary,
    width: 20,
  },
  label: {
    color: finoptTheme.colors.gray600,
    fontSize: 11,
    fontWeight: "700",
  },
  labelActive: {
    color: finoptTheme.colors.primary,
  },
});
