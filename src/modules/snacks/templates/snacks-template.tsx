"use client";

import { useState } from "react";
import { CommonButton } from "@/components/common/common-button";
import { CommonLoader } from "@/components/common/common-loader";
import { DataEmptyHandler } from "@/components/common/data-empty-handler";
import { Checkbox } from "@/components/ui/checkbox";
import { SnackFormDialog } from "@/modules/snacks/components/snack-form-dialog";
import { SnackTable } from "@/modules/snacks/components/snack-table";
import { useSnackActions } from "@/modules/snacks/hooks/useSnackActions";
import { useSnackAPI } from "@/modules/snacks/hooks/useSnackAPI";
import type { Snack } from "@/modules/snacks/types";

export function SnacksTemplate(): React.JSX.Element {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Snack | undefined>();
  const { data = [], isLoading } = useSnackAPI().useGetSnacksQuery(includeInactive);
  const { saveSnack, isSaving } = useSnackActions();

  const openDialog = (snack?: Snack): void => {
    setEditing(snack);
    setDialogOpen(true);
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CommonButton onClick={() => openDialog()}>Add snack</CommonButton>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={includeInactive} onCheckedChange={(v) => setIncludeInactive(v)} />
          Show inactive
        </label>
      </div>
      {isLoading ? (
        <CommonLoader />
      ) : (
        <DataEmptyHandler data={data} emptyMessage="No snacks yet. Add your first snack.">
          <SnackTable
            snacks={data}
            isSaving={isSaving}
            onEdit={openDialog}
            onToggle={(s) => saveSnack({ id: s.id, name: s.name, credits: s.credits, active: !s.active })}
          />
        </DataEmptyHandler>
      )}
      <SnackFormDialog open={dialogOpen} snack={editing} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
