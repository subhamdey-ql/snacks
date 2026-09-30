import { useWatch, type Control } from "react-hook-form";
import type { SnackOption } from "@/modules/dashboard/types";
import type { RecordType, RecordValues } from "@/modules/dashboard/utils/form-utils";

interface Props {
  readonly control: Control<RecordValues, unknown, RecordType>;
  readonly snacks: readonly SnackOption[];
  readonly remaining: number;
}

// Scoped watch: only this small child re-renders as the fields change, not the whole form.
export function CostPreview({ control, snacks, remaining }: Props): React.JSX.Element | null {
  const [snackId, qty] = useWatch({ control, name: ["snackId", "qty"] });
  const snack = snacks.find((s) => String(s.id) === snackId);
  const count = Number(qty);
  if (!snack || !Number.isInteger(count) || count < 1) return null;
  const cost = snack.credits * count;
  return (
    <p className={cost > remaining ? "text-sm text-[var(--gos-red)]" : "text-sm text-muted-foreground"}>
      Costs {cost} credits, {remaining - cost} left after
    </p>
  );
}
