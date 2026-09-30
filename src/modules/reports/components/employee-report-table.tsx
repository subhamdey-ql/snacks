import { CommonTable, type CommonTableColumn } from "@/components/common/common-table";
import { DataEmptyHandler } from "@/components/common/data-empty-handler";
import { ScrollableList } from "@/components/common/scrollable-list";
import type { EmployeeReportRow } from "@/modules/reports/types";

const columns: readonly CommonTableColumn[] = [
  { key: "code", label: "Code" },
  { key: "name", label: "Name" },
  { key: "allowance", label: "Allowance", align: "right" },
  { key: "used", label: "Used", align: "right" },
  { key: "remaining", label: "Remaining", align: "right" },
];

export function EmployeeReportTable({ rows }: { readonly rows: readonly EmployeeReportRow[] }): React.JSX.Element {
  return (
    <DataEmptyHandler data={rows} emptyMessage="No employees.">
      <ScrollableList>
        <CommonTable columns={columns} data={rows.map((r) => ({ ...r, name: <span className="block max-w-[10rem] whitespace-normal [overflow-wrap:anywhere] sm:max-w-xs">{r.name}</span> }))} />
      </ScrollableList>
    </DataEmptyHandler>
  );
}
