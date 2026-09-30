import { CreditLevel } from "@/modules/dashboard/types/enums";

// > 50% left is healthy, 20-50% low, under 20% (or nothing left) critical.
// allowance 0 has no ratio: it reports CRITICAL and the meter draws it neutral next to the "not set" notice.
export function creditLevel(remaining: number, allowance: number): CreditLevel {
  if (allowance <= 0 || remaining <= 0) return CreditLevel.CRITICAL;
  const ratio = remaining / allowance;
  if (ratio > 0.5) return CreditLevel.HEALTHY;
  if (ratio >= 0.2) return CreditLevel.LOW;
  return CreditLevel.CRITICAL;
}
