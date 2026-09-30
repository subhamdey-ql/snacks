import { CommonTable, type CommonTableColumn } from "@/components/common/common-table";
import { DataEmptyHandler } from "@/components/common/data-empty-handler";
import { ScrollableList } from "@/components/common/scrollable-list";
import type { SnackReportRow } from "@/modules/reports/types";

const columns: readonly CommonTableColumn[] = [
  { key: "name", label: "Snack" },
  { key: "qty", label: "Qty", align: "right" },
  { key: "credits", label: "Credits", align: "right" },
];

export function SnackReportTable({ rows }: { readonly rows: readonly SnackReportRow[] }): React.JSX.Element {
  return (
    <DataEmptyHandler data={rows} emptyMessage="No snacks recorded this month.">
      <ScrollableList>
        <CommonTable columns={columns} data={rows.map((r) => ({ ...r, name: <span className="block max-w-[10rem] whitespace-normal sm:max-w-xs">{r.name}</span> }))} />
      </ScrollableList>
    </DataEmptyHandler>
  );
}
