"use client";

import { CopyCheck } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MenuEditor } from "@/modules/menu/components/menu-editor";
import { useMenuActions } from "@/modules/menu/hooks/useMenuActions";
import { useMenuAPI } from "@/modules/menu/hooks/useMenuAPI";

export function MenuTemplate(): React.JSX.Element {
  const { useTodayMenuQuery, useActiveSnacksQuery } = useMenuAPI();
  const { data: menu } = useTodayMenuQuery();
  const { data: snacks } = useActiveSnacksQuery();
  const { copyYesterday, isCopying } = useMenuActions();

  return (
    <div className="stagger flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Today's menu"
        description={menu ? `Tick what's available on ${menu.date}; employees see exactly this.` : "Tick what's available today"}
        actions={
          <Button variant="outline" className="h-11 gap-1.5 px-3.5 md-fine:h-10" disabled={isCopying} onClick={copyYesterday}>
            <CopyCheck className="size-4" aria-hidden />
            {isCopying ? "Copying…" : "Same as yesterday"}
          </Button>
        }
      />
      {menu && snacks ? (
        // Remounting on the saved ids makes "Same as yesterday" and Save reset the ticks to what the server now holds.
        <MenuEditor key={menu.snackIds.join(",")} snacks={snacks} savedIds={menu.snackIds} />
      ) : (
        <Card className="gap-0 px-4 py-2 sm:px-5">
          <TableSkeleton rows={4} />
        </Card>
      )}
    </div>
  );
}
