import * as Notifications from "expo-notifications";

import {
  requestNotificationPermissions,
  scheduleBudgetAlert,
  scheduleSavingsGoalAlert,
} from "@/infrastructure/notifications/notificationService";

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

beforeEach(() => {
  jest.clearAllMocks();
  (mockNotifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
  (mockNotifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
  (mockNotifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue("notif-id");
  (mockNotifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(undefined);
});

test("requestNotificationPermissions returns false when permissions denied", async () => {
  (mockNotifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
  (mockNotifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
  const result = await requestNotificationPermissions();
  expect(result).toBe(false);
});

test("requestNotificationPermissions returns true when already granted", async () => {
  const result = await requestNotificationPermissions();
  expect(result).toBe(true);
});

test("scheduleBudgetAlert cancels existing and schedules notification", async () => {
  await scheduleBudgetAlert(0.9);
  expect(mockNotifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.objectContaining({ title: "Alerte budget" }),
    }),
  );
});

test("scheduleBudgetAlert skips when permissions denied", async () => {
  (mockNotifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
  (mockNotifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
  await scheduleBudgetAlert(0.9);
  expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});

test("scheduleSavingsGoalAlert fires with goal name", async () => {
  await scheduleSavingsGoalAlert("Vacances", 1.0);
  expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.objectContaining({
        title: "Objectif d'épargne",
        body: expect.stringContaining("Vacances"),
      }),
    }),
  );
});
