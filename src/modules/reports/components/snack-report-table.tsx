import { useMemo } from "react";
import { CalendarX2 } from "lucide-react";
import { CommonTable, type CommonTableColumn } from "@/components/common/common-table";
import { DataEmptyHandler } from "@/components/common/data-empty-handler";
import { ScrollableList } from "@/components/common/scrollable-list";
import { Progress } from "@/components/ui/progress";
import type { SnackReportRow } from "@/modules/reports/types";

const columns: readonly CommonTableColumn[] = [
  { key: "name", label: "Snack" },
  { key: "qty", label: "Qty", align: "right" },
  { key: "credits", label: "Credits", align: "right" },
];

export function SnackReportTable({ rows }: { readonly rows: readonly SnackReportRow[] }): React.JSX.Element {
  // The qty bar is relative to the month's most-taken snack; it is decorative (the number is right beside it).
  const data = useMemo(() => {
    const max = Math.max(1, ...rows.map((r) => r.qty));
    return rows.map((r) => ({
      name: <span className="block max-w-[10rem] font-medium whitespace-normal [overflow-wrap:anywhere] sm:max-w-xs">{r.name}</span>,
      qty: (
        <div className="flex items-center justify-end gap-2.5">
          <Progress aria-hidden value={(r.qty / max) * 100} className="hidden w-20 sm:flex" indicatorClassName="bg-[var(--gos-yellow)]" />
          <span className="w-8 text-right font-semibold tabular-nums">{r.qty}</span>
        </div>
      ),
      credits: <span className="tabular-nums">{r.credits}</span>,
    }));
  }, [rows]);
  return (
    <DataEmptyHandler data={rows} icon={CalendarX2} emptyMessage="No snacks recorded this month." hint="Entries from the Home screen show up here.">
      <ScrollableList>
        <CommonTable columns={columns} data={data} />
      </ScrollableList>
    </DataEmptyHandler>
  );
}
