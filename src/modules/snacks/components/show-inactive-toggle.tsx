import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

// Whole row is the label, so the tap target is the 44px row, not the 16px box.
export function ShowInactiveToggle({ checked, onChange }: Props): React.JSX.Element {
  return (
    <Label className="h-11 w-fit cursor-pointer gap-2.5 rounded-xl px-3 leading-5 text-[var(--gos-text)] transition-colors duration-150 hover:bg-[var(--gos-surface-muted)]">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v)} />
      Show inactive snacks
    </Label>
  );
}
