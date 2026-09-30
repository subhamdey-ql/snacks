"use client";

import { DataEmptyHandler } from "@/components/common/data-empty-handler";
import { ScrollableList } from "@/components/common/scrollable-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDashboardActions } from "@/modules/dashboard/hooks/useDashboardActions";
import type { MonthEntry } from "@/modules/dashboard/types";
import { formatIst } from "@/modules/dashboard/utils/form-utils";

interface Props {
  readonly employeeId: number;
  readonly entries: readonly MonthEntry[];
}

export function MonthEntries({ employeeId, entries }: Props): React.JSX.Element {
  const { voidEntry, isVoiding } = useDashboardActions();
  return (
    <DataEmptyHandler data={entries} emptyMessage="Nothing recorded this month.">
      <ScrollableList>
        <ul className="divide-y">
          {entries.map((e) => (
            <li key={e.id} className={cn("flex flex-wrap items-center justify-between gap-2 py-2", e.voidedAt && "text-muted-foreground line-through")}>
              <span className="min-w-0 text-sm [overflow-wrap:anywhere]">
                {e.snackName} × {e.qty} = {e.creditsCharged} · {formatIst(e.createdAt)}
              </span>
              {!e.voidedAt && (
                <Button variant="ghost" size="sm" className="h-10 sm:h-7" disabled={isVoiding} onClick={() => voidEntry(e.id, employeeId)}>
                  Undo
                </Button>
              )}
            </li>
          ))}
        </ul>
      </ScrollableList>
    </DataEmptyHandler>
  );
}
