import type { UseFormReturn } from "react-hook-form";
import { CommonButton } from "@/components/common/common-button";
import { FormInputWrapper } from "@/components/common/form/form-input-wrapper";
import type { SnackOption } from "@/modules/dashboard/types";
import type { RecordType, RecordValues } from "@/modules/dashboard/utils/form-utils";

interface Props {
  readonly form: UseFormReturn<RecordValues, unknown, RecordType>;
  readonly snacks: readonly SnackOption[];
  readonly disabled: boolean;
}

// Snack and qty side by side from sm, stacked on mobile; a full-width Record button below.
export function RecordFields({ form, snacks, disabled }: Props): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 sm:flex-1">
          <FormInputWrapper
            form={form}
            fieldConfig={{
              name: "snackId",
              label: "Snack",
              fieldVariant: "selectField",
              placeHolder: "Pick a snack",
              options: snacks.map((s) => ({ label: `${s.name} (${s.credits})`, value: String(s.id) })),
            }}
          />
        </div>
        <div className="sm:w-28">
          <FormInputWrapper form={form} fieldConfig={{ name: "qty", label: "Quantity", fieldVariant: "numberInput", placeHolder: "Qty" }} />
        </div>
      </div>
      <CommonButton type="submit" disabled={disabled} className="h-12 w-full text-base md-fine:h-12">
        Record
      </CommonButton>
    </div>
  );
}
