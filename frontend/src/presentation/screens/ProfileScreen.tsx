import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { showAlert } from "@/application/alert/alertStore";

import type { RootStackParamList } from "../../../App";
import { useAuthStore } from "@/application/auth/authStore";
import { useAccountsStore } from "@/application/accounts/accountsStore";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

const t = finoptTheme;

export function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const accounts = useAccountsStore((s) => s.accounts);
  const selectedAccountId = useAccountsStore((s) => s.selectedAccountId);
  const selectAccount = useAccountsStore((s) => s.selectAccount);

  function handleLogout() {
    showAlert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: () => void logout(),
        },
      ],
    );
  }

  const displayName = user?.name?.trim() || null;
  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? "??");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {displayName ? <Text style={styles.displayName}>{displayName}</Text> : null}
        <Text style={styles.email}>{user?.email ?? "—"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>COMPTE</Text>
        <View style={styles.card}>
          {displayName ? (
            <>
              <View style={styles.row}>
                <Ionicons name="person-outline" size={20} color={t.colors.gray600} />
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Prénom</Text>
                  <Text style={styles.rowValue}>{displayName}</Text>
                </View>
              </View>
              <View style={styles.divider} />
            </>
          ) : null}
          <View style={styles.row}>
            <Ionicons name="mail-outline" size={20} color={t.colors.gray600} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue}>{user?.email ?? "—"}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Ionicons name="shield-checkmark-outline" size={20} color={t.colors.gray600} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Compte vérifié</Text>
              <Text style={[styles.rowValue, { color: t.colors.primary }]}>Actif</Text>
            </View>
          </View>
        </View>
      </View>

      {accounts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRÉFÉRENCES</Text>
          <View style={styles.card}>
            <View style={[styles.row, { flexWrap: "wrap", gap: t.spacing.sm }]}>
              <View style={{ flex: 1, minWidth: "100%" }}>
                <Text style={styles.rowLabel}>Compte par défaut pour les transactions</Text>
              </View>
              {accounts.map((a, idx) => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => selectAccount(a.id)}
                  style={[
                    styles.accountChip,
                    selectedAccountId === a.id && styles.accountChipActive,
                    idx < accounts.length - 1 && { marginRight: t.spacing.xs },
                  ]}
                >
                  <View style={[styles.chipDot, { backgroundColor: a.color }]} />
                  <Text style={[styles.chipText, selectedAccountId === a.id && styles.chipTextActive]}>
                    {a.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PERSONNALISATION</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("Categories")}>
            <Ionicons name="pricetags-outline" size={20} color={t.colors.gray600} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Catégories</Text>
              <Text style={styles.rowValue}>Gérer mes catégories</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={t.colors.gray400} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>APPLICATION</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="information-circle-outline" size={20} color={t.colors.gray600} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Version</Text>
              <Text style={styles.rowValue}>1.0.0</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={t.colors.danger} />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  content: { padding: t.spacing.xl, gap: t.spacing.lg, paddingBottom: 40 },
  avatarSection: { alignItems: "center", gap: t.spacing.md, paddingVertical: t.spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: t.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...t.shadow.action,
  },
  avatarText: { color: t.colors.white, fontSize: 28, fontWeight: "800" },
  displayName: { color: t.colors.foreground, fontSize: 22, fontWeight: "800" },
  email: { color: t.colors.gray600, fontSize: 14 },
  section: { gap: t.spacing.sm },
  sectionLabel: {
    color: t.colors.gray600,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    paddingHorizontal: t.spacing.xs,
  },
  card: {
    backgroundColor: t.colors.card,
    borderRadius: t.radius.xl,
    borderWidth: 1,
    borderColor: t.colors.border,
    overflow: "hidden",
    ...t.shadow.card,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: t.spacing.md,
    padding: t.spacing.lg,
  },
  rowContent: { flex: 1 },
  rowLabel: { color: t.colors.gray600, fontSize: 12, marginBottom: 2 },
  rowValue: { color: t.colors.foreground, fontWeight: "600", fontSize: 14 },
  divider: { height: 1, backgroundColor: t.colors.border, marginHorizontal: t.spacing.lg },
  logoutButton: {
    alignItems: "center",
    backgroundColor: t.colors.card,
    borderRadius: t.radius.xl,
    borderWidth: 1.5,
    borderColor: t.colors.danger,
    flexDirection: "row",
    gap: t.spacing.md,
    justifyContent: "center",
    marginTop: t.spacing.md,
    paddingVertical: t.spacing.lg,
  },
  logoutText: { color: t.colors.danger, fontWeight: "800", fontSize: 16 },
  accountChip: {
    alignItems: "center",
    borderColor: t.colors.border,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    backgroundColor: t.colors.muted,
  },
  accountChipActive: {
    backgroundColor: t.colors.primaryLight,
    borderColor: t.colors.primary,
  },
  chipDot: { width: 10, height: 10, borderRadius: 5 },
  chipText: { color: t.colors.foreground, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: t.colors.primary, fontWeight: "700" },
});
