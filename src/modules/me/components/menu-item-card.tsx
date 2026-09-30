import { CreditsPill } from "@/components/common/credits-pill";
import { SnackTile } from "@/components/common/snack-tile";
import { StatusBadge } from "@/components/common/status-badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MyMenuItem } from "@/modules/me/types";
import { BadgeTone } from "@/types/enums";

// One available snack. Unaffordable ones stay visible (so people know what exists) but are muted and labelled.
export function MenuItemCard({ item }: { readonly item: MyMenuItem }): React.JSX.Element {
  return (
    <Card className={cn("flex-row items-center gap-3 p-3 sm:p-4", !item.affordable && "opacity-60")}>
      <SnackTile name={item.name} className="size-12" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[var(--gos-text)] [overflow-wrap:anywhere]">{item.name}</p>
        <div className="mt-1">
          <CreditsPill credits={item.credits} />
        </div>
      </div>
      {!item.affordable && <StatusBadge tone={BadgeTone.WARNING}>Not enough credits</StatusBadge>}
    </Card>
  );
}
