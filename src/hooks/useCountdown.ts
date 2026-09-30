import { useEffect, useState } from "react";

// Whole seconds left on a cooldown (e.g. "resend code in 42s"); start(n) begins a new one.
export function useCountdown(): { left: number; start: (seconds: number) => void } {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return { left, start: setLeft };
}
