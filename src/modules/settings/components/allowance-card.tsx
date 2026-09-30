import type { LucideIcon } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { FormInputWrapper } from "@/components/common/form/form-input-wrapper";
import { Card } from "@/components/ui/card";
import type { AllowanceFormValues } from "@/modules/settings/utils/form-utils";
import type { EmployeeType } from "@/types/enums";

interface Props {
  readonly form: UseFormReturn<AllowanceFormValues>;
  readonly type: EmployeeType;
  readonly icon: LucideIcon;
  readonly title: string;
  readonly subtitle: string;
  readonly label: string;
}

// One employee type's monthly credits: icon + title, then a big numeric field (same validation as before).
export function AllowanceCard({ form, type, icon: Icon, title, subtitle, label }: Props): React.JSX.Element {
  return (
    <Card className="gap-4 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--gos-blue-light)] text-[var(--gos-blue-text)]">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-[var(--gos-text)]">{title}</h2>
          <p className="text-sm text-[var(--gos-text-muted)]">{subtitle}</p>
        </div>
      </div>
      <FormInputWrapper
        form={form}
        fieldConfig={{ name: type, fieldVariant: "numberInput", label, className: "h-14 text-2xl font-bold tabular-nums" }}
      />
    </Card>
  );
}
