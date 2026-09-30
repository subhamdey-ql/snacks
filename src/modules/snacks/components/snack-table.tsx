import { useMemo } from "react";
import { CommonTable, type CommonTableColumn } from "@/components/common/common-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Snack } from "@/modules/snacks/types";

const columns: readonly CommonTableColumn[] = [
  { key: "name", label: "Name" },
  { key: "credits", label: "Credits" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", align: "right" },
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
        name: <span className="block max-w-[10rem] whitespace-normal [overflow-wrap:anywhere] sm:max-w-xs">{s.name}</span>,
        credits: s.credits,
        status: <Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Active" : "Inactive"}</Badge>,
        actions: (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" className="h-10 sm:h-7" onClick={() => onEdit(s)}>
              Edit
            </Button>
            <Button variant="outline" size="sm" className="h-10 sm:h-7" disabled={isSaving} onClick={() => onToggle(s)}>
              {s.active ? "Deactivate" : "Activate"}
            </Button>
          </div>
        ),
      })),
    [snacks, isSaving, onEdit, onToggle],
  );
  return <CommonTable columns={columns} data={data} />;
}
