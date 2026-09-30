import { Coins } from "lucide-react";

// Warm yellow price tag: "1 credit" / "2 credits".
export function CreditsPill({ credits }: { readonly credits: number }): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gos-yellow-light)] px-2.5 py-1 text-xs font-semibold text-[var(--gos-text)] ring-1 ring-[var(--gos-yellow)]/50 ring-inset tabular-nums">
      <Coins className="size-3.5 text-[var(--gos-orange)]" aria-hidden />
      {credits} {credits === 1 ? "credit" : "credits"}
    </span>
  );
}
