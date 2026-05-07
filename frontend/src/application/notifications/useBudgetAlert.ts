import { useEffect, useRef } from "react";

import { useNotificationsStore } from "@/application/notifications/notificationsStore";
import { scheduleBudgetAlert } from "@/infrastructure/notifications/notificationService";

const WARN_THRESHOLD = 0.8;
const EXCEEDED_THRESHOLD = 1.0;

export function useBudgetAlert(
  monthlyExpenses: number,
  totalPlanned: number | null | undefined,
): void {
  const alertedRatioRef = useRef<number | null>(null);

  useEffect(() => {
    if (!totalPlanned || totalPlanned <= 0) return;
    const ratio = monthlyExpenses / totalPlanned;
    if (ratio < WARN_THRESHOLD) {
      alertedRatioRef.current = null;
      return;
    }
    // Fire at 80% warning and again when budget is exceeded (>=100%)
    const crossedExceeded = ratio >= EXCEEDED_THRESHOLD && (alertedRatioRef.current === null || alertedRatioRef.current < EXCEEDED_THRESHOLD);
    const crossedWarn = ratio >= WARN_THRESHOLD && alertedRatioRef.current === null;
    if (!crossedWarn && !crossedExceeded) return;
    alertedRatioRef.current = ratio;
    const pct = Math.round(ratio * 100);
    const exceeded = ratio >= EXCEEDED_THRESHOLD;
    useNotificationsStore.getState().addNotification(
      exceeded ? "Budget dépassé !" : "Alerte budget",
      exceeded
        ? `Vous avez dépassé votre budget mensuel (${pct}%).`
        : `Vous avez utilisé ${pct}% de votre budget mensuel.`,
    );
    void scheduleBudgetAlert(ratio);
  }, [monthlyExpenses, totalPlanned]);
}
