import { useMemo } from "react";
import { UserX } from "lucide-react";
import { CommonTable, type CommonTableColumn } from "@/components/common/common-table";
import { DataEmptyHandler } from "@/components/common/data-empty-handler";
import { IdentityCell } from "@/components/common/identity-cell";
import { ScrollableList } from "@/components/common/scrollable-list";
import { UserAvatar } from "@/components/common/user-avatar";
import { RemainingBar } from "@/modules/reports/components/remaining-bar";
import type { EmployeeReportRow } from "@/modules/reports/types";

const columns: readonly CommonTableColumn[] = [
  { key: "name", label: "Employee" },
  { key: "allowance", label: "Allowance", align: "right" },
  { key: "used", label: "Used", align: "right" },
  { key: "remaining", label: "Remaining", align: "right" },
];

export function EmployeeReportTable({ rows }: { readonly rows: readonly EmployeeReportRow[] }): React.JSX.Element {
  const data = useMemo(
    () =>
      rows.map((r) => ({
        name: <IdentityCell leading={<UserAvatar name={r.name} seed={r.code} className="size-9 text-xs" />} title={r.name} subtitle={r.code} />,
        allowance: <span className="tabular-nums">{r.allowance}</span>,
        used: <span className="tabular-nums">{r.used}</span>,
        remaining: <RemainingBar remaining={r.remaining} allowance={r.allowance} />,
      })),
    [rows],
  );
  return (
    <DataEmptyHandler data={rows} icon={UserX} emptyMessage="No employees." hint="Add employees to see their monthly usage here.">
      {/* Internal scroll only on md+; on phones the stacked rows just flow with the page. */}
      <ScrollableList className="max-md:max-h-none max-md:overflow-visible">
        <CommonTable columns={columns} data={data} stackOnMobile />
      </ScrollableList>
    </DataEmptyHandler>
  );
}
