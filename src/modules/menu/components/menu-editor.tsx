"use client";

import { useState } from "react";
import { Cookie } from "lucide-react";
import { CommonButton } from "@/components/common/common-button";
import { DataEmptyHandler } from "@/components/common/data-empty-handler";
import { Card } from "@/components/ui/card";
import { MenuRow } from "@/modules/menu/components/menu-row";
import { useMenuActions } from "@/modules/menu/hooks/useMenuActions";
import type { MenuSnack } from "@/modules/menu/types";

interface Props {
  readonly snacks: readonly MenuSnack[];
  // What the server has saved. The parent remounts this editor (key) whenever that changes, so the local ticks restart from it.
  readonly savedIds: readonly number[];
}

export function MenuEditor({ snacks, savedIds }: Props): React.JSX.Element {
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set(savedIds));
  const { saveMenu, isSaving } = useMenuActions();

  const toggle = (id: number, on: boolean): void =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <Card className="gap-3 p-4 sm:p-5">
      <DataEmptyHandler data={snacks} icon={Cookie} emptyMessage="No active snacks." hint="Add snacks first, then pick today's menu here.">
        <ul className="flex flex-col gap-1">
          {snacks.map((s) => (
            <MenuRow key={s.id} snack={s} checked={selected.has(s.id)} onChange={(on) => toggle(s.id, on)} />
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-[var(--gos-border)] pt-3">
          <span className="text-sm text-[var(--gos-text-muted)]">{selected.size} available today</span>
          <CommonButton disabled={isSaving} onClick={() => saveMenu([...selected])}>
            {isSaving ? "Saving…" : "Save menu"}
          </CommonButton>
        </div>
      </DataEmptyHandler>
    </Card>
  );
}
