import { useEffect, useRef } from "react";

import { scheduleBudgetAlert } from "@/infrastructure/notifications/notificationService";

const ALERT_THRESHOLD = 0.8;

export function useBudgetAlert(
  monthlyExpenses: number,
  totalPlanned: number | null | undefined,
): void {
  const alertedRatioRef = useRef<number | null>(null);

  useEffect(() => {
    if (!totalPlanned || totalPlanned <= 0) return;
    const ratio = monthlyExpenses / totalPlanned;
    if (ratio < ALERT_THRESHOLD) return;
    // Only fire once per threshold crossing (avoid repeated notifications)
    if (alertedRatioRef.current !== null && ratio <= alertedRatioRef.current + 0.05) return;
    alertedRatioRef.current = ratio;
    void scheduleBudgetAlert(ratio);
  }, [monthlyExpenses, totalPlanned]);
}
