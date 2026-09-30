import { Popcorn } from "lucide-react";
import { DataEmptyHandler } from "@/components/common/data-empty-handler";
import { ScrollableList } from "@/components/common/scrollable-list";
import { formatIst } from "@/lib/format-ist";
import { cn } from "@/lib/utils";
import type { MyEntry } from "@/modules/me/types";

// Read-only timeline of this month's entries, newest first; undone ones are struck through.
export function WalletEntries({ entries }: { readonly entries: readonly MyEntry[] }): React.JSX.Element {
  return (
    <DataEmptyHandler data={entries} emptyMessage="Nothing munched this month yet." hint="Snacks the uncle records for you show up here." icon={Popcorn}>
      <ScrollableList>
        <ul className="relative before:absolute before:inset-y-3 before:left-[10px] before:w-0.5 before:rounded-full before:bg-[var(--gos-border)]">
          {entries.map((e) => {
            const voided = e.voidedAt !== null;
            return (
              <li key={e.id} className="relative flex flex-col gap-0.5 py-2.5 pl-7">
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1/2 left-[5px] size-3 -translate-y-1/2 rounded-full border-2",
                    voided ? "border-[var(--gos-neutral)] bg-[var(--gos-surface)]" : "border-[var(--gos-primary)] bg-[var(--gos-primary)]",
                  )}
                />
                <span className={cn("flex flex-wrap items-center gap-2", voided && "text-[var(--gos-text-muted)] line-through")}>
                  <span className="font-medium [overflow-wrap:anywhere]">{e.snackName}</span>
                  <span className="rounded-full bg-[var(--gos-yellow-light)] px-2 py-0.5 text-xs font-medium tabular-nums text-[var(--gos-text)]">
                    × {e.qty} = {e.creditsCharged} credits
                  </span>
                </span>
                <span className="text-xs text-[var(--gos-text-muted)]">
                  {formatIst(e.createdAt)}
                  {voided && " · undone"}
                </span>
              </li>
            );
          })}
        </ul>
      </ScrollableList>
    </DataEmptyHandler>
  );
}
