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

// Snack picker, qty and submit; stacks on mobile, one row from sm up.
export function RecordFields({ form, snacks, disabled }: Props): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="sm:flex-1">
        <FormInputWrapper
          form={form}
          fieldConfig={{
            name: "snackId",
            fieldVariant: "selectField",
            placeHolder: "Pick a snack",
            options: snacks.map((s) => ({ label: `${s.name} (${s.credits})`, value: String(s.id) })),
          }}
        />
      </div>
      <div className="sm:w-24">
        <FormInputWrapper form={form} fieldConfig={{ name: "qty", fieldVariant: "numberInput", placeHolder: "Qty" }} />
      </div>
      <CommonButton type="submit" disabled={disabled} className="h-10 sm:w-32">
        Record
      </CommonButton>
    </div>
  );
}
