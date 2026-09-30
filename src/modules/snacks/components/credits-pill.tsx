import { Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Warm yellow price tag: "1 credit" / "2 credits". Badge's fixed height, border and clipping are reset for this pill.
export function CreditsPill({ credits }: { readonly credits: number }): React.JSX.Element {
  return (
    <Badge className="h-auto justify-start gap-1.5 overflow-visible rounded-full border-0 bg-[var(--gos-yellow-light)] px-2.5 py-1 text-xs font-semibold text-[var(--gos-text)] ring-1 ring-[var(--gos-yellow)]/50 ring-inset tabular-nums">
      <Coins className="size-3.5 text-[var(--gos-orange)]" aria-hidden />
      {credits} {credits === 1 ? "credit" : "credits"}
    </Badge>
  );
}
