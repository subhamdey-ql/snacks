"use client";

import { CalendarX2 } from "lucide-react";
import { DataEmptyHandler } from "@/components/common/data-empty-handler";
import { ScrollableList } from "@/components/common/scrollable-list";
import { EntryItem } from "@/modules/dashboard/components/entry-item";
import { useDashboardActions } from "@/modules/dashboard/hooks/useDashboardActions";
import type { MonthEntry } from "@/modules/dashboard/types";

interface Props {
  readonly employeeId: number;
  readonly entries: readonly MonthEntry[];
}

// Timeline: a vertical line (the ul's ::before) with one dot per entry, newest first as the API returns them.
export function MonthEntries({ employeeId, entries }: Props): React.JSX.Element {
  const { voidEntry, isVoiding } = useDashboardActions();
  return (
    <DataEmptyHandler data={entries} emptyMessage="Nothing recorded this month." icon={CalendarX2}>
      <ScrollableList>
        <ul className="relative before:absolute before:inset-y-3 before:left-[10px] before:w-0.5 before:rounded-full before:bg-[var(--gos-border)]">
          {entries.map((e) => (
            <EntryItem key={e.id} entry={e} disabled={isVoiding} onUndo={() => voidEntry(e.id, employeeId)} />
          ))}
        </ul>
      </ScrollableList>
    </DataEmptyHandler>
  );
}
