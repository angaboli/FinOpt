import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../../../App";
import { useNotificationsStore } from "@/application/notifications/notificationsStore";
import { finoptTheme } from "@/presentation/theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

const t = finoptTheme;

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function NotificationsScreen({ navigation: _navigation }: Props) {
  const notifications = useNotificationsStore((s) => s.notifications);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={40} color={t.colors.gray400} />
          <Text style={styles.emptyTitle}>Aucune notification</Text>
          <Text style={styles.emptyText}>Les alertes budget et objectifs d'épargne apparaîtront ici.</Text>
        </View>
      ) : (
        notifications.map((n) => (
          <View key={n.id} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons
                name={n.title.includes("dépassé") ? "alert-circle-outline" : "notifications-outline"}
                size={20}
                color={n.title.includes("dépassé") ? t.colors.danger : t.colors.primary}
              />
            </View>
            <View style={styles.body}>
              <Text style={styles.cardTitle}>{n.title}</Text>
              <Text style={styles.cardBody}>{n.body}</Text>
              <Text style={styles.cardTime}>
                {timeFormatter.format(new Date(n.createdAt))}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: t.colors.background, flex: 1 },
  content: { gap: t.spacing.sm, padding: t.spacing.xl, paddingBottom: t.spacing.xxl },
  empty: {
    alignItems: "center",
    gap: t.spacing.md,
    marginTop: 60,
    paddingHorizontal: t.spacing.xl,
  },
  emptyTitle: { color: t.colors.foreground, fontWeight: "800", fontSize: 16 },
  emptyText: { color: t.colors.gray600, lineHeight: 20, textAlign: "center" },
  card: {
    alignItems: "flex-start",
    backgroundColor: t.colors.card,
    borderColor: t.colors.border,
    borderRadius: t.radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: t.spacing.md,
    padding: t.spacing.lg,
    ...t.shadow.card,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: t.colors.muted,
    borderRadius: t.radius.lg,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  body: { flex: 1, gap: 3 },
  cardTitle: { color: t.colors.foreground, fontWeight: "800", fontSize: 14 },
  cardBody: { color: t.colors.gray600, fontSize: 13, lineHeight: 19 },
  cardTime: { color: t.colors.gray500, fontSize: 11, marginTop: 2 },
});
