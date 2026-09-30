import { useMemo } from "react";
import { CommonTable, type CommonTableColumn } from "@/components/common/common-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Employee } from "@/modules/employees/types";

const columns: readonly CommonTableColumn[] = [
  { key: "code", label: "Code" },
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", align: "right" },
];

interface Props {
  readonly employees: readonly Employee[];
  readonly isSaving: boolean;
  readonly onEdit: (employee: Employee) => void;
  readonly onToggle: (employee: Employee) => void;
}

export function EmployeeTable({ employees, isSaving, onEdit, onToggle }: Props): React.JSX.Element {
  const data = useMemo(
    () =>
      employees.map((e) => ({
        code: e.code,
        name: <span className="block max-w-[10rem] whitespace-normal [overflow-wrap:anywhere] sm:max-w-xs">{e.name}</span>,
        type: e.type,
        status: <Badge variant={e.active ? "default" : "secondary"}>{e.active ? "Active" : "Inactive"}</Badge>,
        actions: (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" className="h-10 sm:h-7" onClick={() => onEdit(e)}>
              Edit
            </Button>
            <Button variant="outline" size="sm" className="h-10 sm:h-7" disabled={isSaving} onClick={() => onToggle(e)}>
              {e.active ? "Deactivate" : "Activate"}
            </Button>
          </div>
        ),
      })),
    [employees, isSaving, onEdit, onToggle],
  );
  return <CommonTable columns={columns} data={data} />;
}
