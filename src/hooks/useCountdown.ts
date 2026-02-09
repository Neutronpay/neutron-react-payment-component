import { useState, useEffect, useCallback } from "react";

export function useCountdown(expiresAt: number | undefined) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) return;
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = useCallback((ms: number | null): string => {
    if (ms === null || ms <= 0) return "0:00";
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }, []);

  return {
    timeLeft,
    formatted: formatTime(timeLeft),
    isExpired: timeLeft !== null && timeLeft <= 0,
    progress: expiresAt && timeLeft !== null
      ? Math.max(0, timeLeft / (expiresAt - Date.now() + timeLeft))
      : 1,
  };
}
