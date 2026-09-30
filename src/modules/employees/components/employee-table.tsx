import { useMemo } from "react";
import { Pencil, Power } from "lucide-react";
import { CommonTable, type CommonTableColumn } from "@/components/common/common-table";
import { IdentityCell } from "@/components/common/identity-cell";
import { RowActionButton } from "@/components/common/row-action-button";
import { StatusBadge } from "@/components/common/status-badge";
import { UserAvatar } from "@/components/common/user-avatar";
import type { Employee } from "@/modules/employees/types";
import { EMPLOYEE_TYPE_BADGE } from "@/modules/employees/utils/employee-display";
import { BadgeTone } from "@/types/enums";

const columns: readonly CommonTableColumn[] = [
  { key: "name", label: "Employee", hideLabelOnMobile: true },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", align: "right", hideLabelOnMobile: true },
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
        name: <IdentityCell leading={<UserAvatar name={e.name} seed={e.code} />} title={e.name} subtitle={e.code} />,
        type: <StatusBadge tone={EMPLOYEE_TYPE_BADGE[e.type].tone}>{EMPLOYEE_TYPE_BADGE[e.type].label}</StatusBadge>,
        status: <StatusBadge tone={e.active ? BadgeTone.SUCCESS : BadgeTone.MUTED}>{e.active ? "Active" : "Inactive"}</StatusBadge>,
        actions: (
          <div className="flex flex-wrap gap-2 md:justify-end">
            <RowActionButton icon={Pencil} label="Edit" onClick={() => onEdit(e)} />
            <RowActionButton icon={Power} label={e.active ? "Deactivate" : "Activate"} disabled={isSaving} onClick={() => onToggle(e)} />
          </div>
        ),
      })),
    [employees, isSaving, onEdit, onToggle],
  );
  return <CommonTable columns={columns} data={data} stackOnMobile />;
}
