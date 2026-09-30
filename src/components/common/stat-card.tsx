import type { LucideIcon } from "lucide-react";
import { ACCENT_CLASSES } from "@/components/common/accent-classes";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AccentTone } from "@/types/enums";

interface StatCardProps {
  readonly icon: LucideIcon;
  readonly label: string;
  // null = still loading (skeleton); undefined = failed (dash).
  readonly value: number | null | undefined;
  readonly tone: AccentTone;
}

// Icon + big numeral + label. Compact and stacked on phones (3-up fits at 375px), icon beside the number from sm.
export function StatCard({ icon: Icon, label, value, tone }: StatCardProps): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-[var(--gos-border)] bg-[var(--gos-surface)] p-3 shadow-[var(--gos-shadow)] sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <span aria-hidden className={cn("flex size-9 shrink-0 items-center justify-center rounded-full sm:size-12", ACCENT_CLASSES[tone])}>
        <Icon className="size-4 sm:size-6" />
      </span>
      <div className="min-w-0">
        {value === null ? (
          <Skeleton className="h-8 w-12 rounded-lg sm:h-9" />
        ) : (
          <span className="block text-2xl leading-8 font-bold text-[var(--gos-text)] tabular-nums sm:text-3xl sm:leading-9">{value ?? "–"}</span>
        )}
        <span className="block text-xs leading-tight text-[var(--gos-text-muted)] sm:text-sm">{label}</span>
      </div>
    </div>
  );
}
