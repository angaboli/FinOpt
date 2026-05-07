import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { finoptTheme } from "@/presentation/theme/theme";

export type BottomTab = "home" | "transactions" | "conseils" | "profil";

interface BottomNavProps {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
}

const tabs: Array<{ id: BottomTab; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }> = [
  { id: "home", label: "Accueil", icon: "home-outline", iconActive: "home" },
  { id: "transactions", label: "Flux", icon: "swap-horizontal-outline", iconActive: "swap-horizontal" },
  { id: "conseils", label: "Conseils", icon: "bulb-outline", iconActive: "bulb" },
  { id: "profil", label: "Profil", icon: "person-outline", iconActive: "person" },
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
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={22}
              color={isActive ? finoptTheme.colors.primary : finoptTheme.colors.gray600}
            />
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
    justifyContent: "center",
    minHeight: 52,
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
