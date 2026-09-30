import { useMemo } from "react";
import { Pencil, Power } from "lucide-react";
import { CommonTable, type CommonTableColumn } from "@/components/common/common-table";
import { IdentityCell } from "@/components/common/identity-cell";
import { RowActionButton } from "@/components/common/row-action-button";
import { SnackTile } from "@/components/common/snack-tile";
import { StatusBadge } from "@/components/common/status-badge";
import { CreditsPill } from "@/modules/snacks/components/credits-pill";
import type { Snack } from "@/modules/snacks/types";
import { BadgeTone } from "@/types/enums";

const columns: readonly CommonTableColumn[] = [
  { key: "name", label: "Snack" },
  { key: "credits", label: "Price" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", align: "right", isActions: true },
];

interface Props {
  readonly snacks: readonly Snack[];
  readonly isSaving: boolean;
  readonly onEdit: (snack: Snack) => void;
  readonly onToggle: (snack: Snack) => void;
}

export function SnackTable({ snacks, isSaving, onEdit, onToggle }: Props): React.JSX.Element {
  const data = useMemo(
    () =>
      snacks.map((s) => ({
        name: <IdentityCell leading={<SnackTile name={s.name} />} title={s.name} />,
        credits: <CreditsPill credits={s.credits} />,
        status: <StatusBadge tone={s.active ? BadgeTone.SUCCESS : BadgeTone.MUTED}>{s.active ? "Active" : "Inactive"}</StatusBadge>,
        actions: (
          <div className="flex flex-wrap gap-2 md:justify-end">
            <RowActionButton icon={Pencil} label="Edit" onClick={() => onEdit(s)} />
            <RowActionButton icon={Power} label={s.active ? "Deactivate" : "Activate"} disabled={isSaving} onClick={() => onToggle(s)} />
          </div>
        ),
      })),
    [snacks, isSaving, onEdit, onToggle],
  );
  return <CommonTable columns={columns} data={data} stackOnMobile />;
}
