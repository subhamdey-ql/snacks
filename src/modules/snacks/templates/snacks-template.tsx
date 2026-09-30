"use client";

import { useState } from "react";
import { Cookie, Plus } from "lucide-react";
import { CommonButton } from "@/components/common/common-button";
import { DataEmptyHandler } from "@/components/common/data-empty-handler";
import { PageHeader } from "@/components/common/page-header";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Card } from "@/components/ui/card";
import { ShowInactiveToggle } from "@/modules/snacks/components/show-inactive-toggle";
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
    <div className="stagger flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Snacks"
        description="What's on the counter and what it costs"
        actions={
          <CommonButton className="gap-1.5" onClick={() => openDialog()}>
            <Plus className="size-4" aria-hidden />
            Add snack
          </CommonButton>
        }
      />
      <Card className="gap-0 px-4 py-2 sm:px-5">
        <div className="-mx-1 border-b border-[var(--gos-border)] pb-2">
          <ShowInactiveToggle checked={includeInactive} onChange={setIncludeInactive} />
        </div>
        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : (
          <DataEmptyHandler
            data={data}
            icon={Cookie}
            emptyMessage={includeInactive ? "No snacks yet." : "No active snacks."}
            hint={includeInactive ? "Add your first snack to start recording." : "Add a snack, or show inactive ones to bring one back."}
          >
            <SnackTable
              snacks={data}
              isSaving={isSaving}
              onEdit={openDialog}
              onToggle={(s) => saveSnack({ id: s.id, name: s.name, credits: s.credits, active: !s.active })}
            />
          </DataEmptyHandler>
        )}
      </Card>
      <SnackFormDialog open={dialogOpen} snack={editing} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
