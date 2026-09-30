import { cn } from "@/lib/utils";
import { CreditLevel } from "@/types/enums";
import type { CreditBalance } from "@/types/api";
import { creditLevel } from "@/lib/credit-level";

const R = 52;
const CIRCUMFERENCE = 2 * Math.PI * R;
const STROKE: Record<CreditLevel, string> = {
  [CreditLevel.HEALTHY]: "stroke-[var(--gos-green)]",
  [CreditLevel.LOW]: "stroke-[var(--gos-orange)]",
  [CreditLevel.CRITICAL]: "stroke-[var(--gos-red)]",
};

// Ring of remaining/allowance. Negative remaining draws as empty; allowance 0 draws an empty neutral ring.
// The dashoffset transition is switched off globally under prefers-reduced-motion.
export function CreditMeter({ balance: { allowance, used, remaining } }: { readonly balance: CreditBalance }): React.JSX.Element {
  const fraction = allowance > 0 ? Math.min(1, Math.max(0, remaining / allowance)) : 0;
  const stroke = allowance > 0 ? STROKE[creditLevel(remaining, allowance)] : "stroke-[var(--gos-neutral)]";
  return (
    <div className="flex flex-col items-center gap-3">
      <div role="img" aria-label={`${remaining} of ${allowance} credits left`} className="relative size-44">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="10" className="stroke-[var(--gos-surface-muted)]" />
          <circle
            cx="60" cy="60" r={R} fill="none" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
            className={cn("transition-[stroke-dashoffset,stroke] duration-500 ease-out", stroke, fraction === 0 && "opacity-0")}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tracking-tight text-[var(--gos-text)] tabular-nums">{remaining}</span>
          <span className="text-sm text-[var(--gos-text-muted)]">credits left</span>
        </div>
      </div>
      <p className="text-sm text-[var(--gos-text-muted)]">
        Used <span className="font-semibold text-[var(--gos-text)] tabular-nums">{used}</span> of{" "}
        <span className="font-semibold text-[var(--gos-text)] tabular-nums">{allowance}</span> this month
      </p>
    </div>
  );
}
