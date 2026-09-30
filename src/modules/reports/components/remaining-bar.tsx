import { Progress } from "@/components/ui/progress";
import { creditLevel } from "@/lib/credit-level";
import { CreditLevel } from "@/types/enums";

// Same thresholds/colours as the dashboard credit meter.
const FILL: Readonly<Record<CreditLevel, string>> = {
  [CreditLevel.HEALTHY]: "bg-[var(--gos-green)]",
  [CreditLevel.LOW]: "bg-[var(--gos-orange)]",
  [CreditLevel.CRITICAL]: "bg-[var(--gos-red)]",
};

interface Props {
  readonly remaining: number;
  readonly allowance: number;
}

// Number + small bar of remaining/allowance. Allowance 0 has no ratio, so it draws an empty neutral track.
export function RemainingBar({ remaining, allowance }: Props): React.JSX.Element {
  const percent = allowance > 0 ? Math.min(100, Math.max(0, (remaining / allowance) * 100)) : 0;
  return (
    <div className="flex items-center justify-end gap-2.5">
      <Progress
        value={percent}
        aria-label={`${remaining} of ${allowance} credits left`}
        className="w-16 sm:w-20"
        indicatorClassName={allowance > 0 ? FILL[creditLevel(remaining, allowance)] : "bg-[var(--gos-neutral)]"}
      />
      <span className="w-8 text-right font-semibold tabular-nums">{remaining}</span>
    </div>
  );
}
