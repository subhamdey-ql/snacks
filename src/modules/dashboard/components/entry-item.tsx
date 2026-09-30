import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MonthEntry } from "@/modules/dashboard/types";
import { formatIst } from "@/lib/format-ist";

interface Props {
  readonly entry: MonthEntry;
  readonly disabled: boolean;
  readonly onUndo: () => void;
}

// One timeline row: the dot sits on the list's vertical line (hollow + grey when voided).
export function EntryItem({ entry: e, disabled, onUndo }: Props): React.JSX.Element {
  const voided = e.voidedAt !== null;
  return (
    <li className="animate-fade-in-up relative flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 pl-7">
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 left-[5px] size-3 -translate-y-1/2 rounded-full border-2",
          voided ? "border-[var(--gos-neutral)] bg-[var(--gos-surface)]" : "border-[var(--gos-primary)] bg-[var(--gos-primary)]",
        )}
      />
      <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", voided && "text-[var(--gos-text-muted)] line-through")}>
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium [overflow-wrap:anywhere]">{e.snackName}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", voided ? "bg-[var(--gos-surface-muted)]" : "bg-[var(--gos-yellow-light)] text-[var(--gos-text)]")}>
            × {e.qty} = {e.creditsCharged} credits
          </span>
        </span>
        <span className="text-xs text-[var(--gos-text-muted)]">
          {formatIst(e.createdAt)}
          {voided && <span className="sr-only"> (undone)</span>}
        </span>
      </div>
      {!voided && (
        <Button variant="ghost" size="sm" className="h-11 px-3 text-[var(--gos-text-muted)] hover:text-[var(--gos-red)] md-fine:h-10" disabled={disabled} onClick={onUndo}>
          <Undo2 className="size-4" aria-hidden />
          Undo
        </Button>
      )}
    </li>
  );
}
