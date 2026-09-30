import { CreditsPill } from "@/components/common/credits-pill";
import { SnackTile } from "@/components/common/snack-tile";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { MenuSnack } from "@/modules/menu/types";

interface Props {
  readonly snack: MenuSnack;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

// The whole row is the tap target (a label around the checkbox), 56px tall. shadcn Label brings its own text size,
// weight and line-height, so those are reset to inherit to keep the row looking exactly as a plain label did.
export function MenuRow({ snack, checked, onChange }: Props): React.JSX.Element {
  return (
    <li>
      <Label className="min-h-14 cursor-pointer gap-3 rounded-xl px-2 py-2 text-[length:inherit] leading-[inherit] font-[weight:inherit] hover:bg-[var(--gos-surface-muted)]">
        <Checkbox checked={checked} onCheckedChange={(next) => onChange(next === true)} aria-label={`${snack.name} is available today`} />
        <SnackTile name={snack.name} />
        <span className="min-w-0 flex-1 font-medium text-[var(--gos-text)] [overflow-wrap:anywhere]">{snack.name}</span>
        <CreditsPill credits={snack.credits} />
      </Label>
    </li>
  );
}
