import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch {
  // expo-notifications not fully supported in Expo Go — silently skip
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (!Device.isDevice) return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return false;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("budget-alerts", {
        name: "Alertes budget",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function scheduleBudgetAlert(ratio: number): Promise<void> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    const pct = Math.round(ratio * 100);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Alerte budget",
        body: `Vous avez utilisé ${pct}% de votre budget mensuel.`,
        data: { type: "budget_alert" },
      },
      trigger: null,
    });
  } catch {
    // silently skip in Expo Go
  }
}

export async function scheduleSavingsGoalAlert(name: string, ratio: number): Promise<void> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;
    const pct = Math.round(ratio * 100);
    const milestone = ratio >= 1 ? "atteint" : `à ${pct}%`;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Objectif d'épargne",
        body: `"${name}" est maintenant ${milestone} !`,
        data: { type: "savings_goal_alert" },
      },
      trigger: null,
    });
  } catch {
    // silently skip in Expo Go
  }
}
