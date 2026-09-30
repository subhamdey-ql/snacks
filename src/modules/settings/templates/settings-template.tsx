"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CommonButton } from "@/components/common/common-button";
import { CommonLoader } from "@/components/common/common-loader";
import { Form } from "@/components/common/form/form";
import { FormInputWrapper } from "@/components/common/form/form-input-wrapper";
import { useAllowanceActions } from "@/modules/settings/hooks/useAllowanceActions";
import { useAllowanceAPI } from "@/modules/settings/hooks/useAllowanceAPI";
import {
  allowanceDefaults,
  allowanceSchema,
  type AllowanceFormValues,
} from "@/modules/settings/utils/form-utils";
import { EmployeeType } from "@/types/enums";

export function SettingsTemplate(): React.JSX.Element {
  const { data, isLoading, isError, refetch } = useAllowanceAPI().useGetAllowanceQuery();
  const { saveAllowance, isSaving } = useAllowanceActions();
  // `values` refills the form when the query resolves (numbers become strings for the inputs).
  const form = useForm<AllowanceFormValues>({
    resolver: zodResolver(allowanceSchema),
    defaultValues: allowanceDefaults(),
    values: data ? allowanceDefaults(data) : undefined,
  });

  if (isLoading) return <CommonLoader />;
  // Never show (or allow saving) the form until the current values have loaded.
  if (isError || !data) {
    return (
      <div className="flex max-w-md flex-col items-start gap-3">
        <p className="text-sm text-destructive">Could not load the monthly credits.</p>
        <CommonButton type="button" onClick={() => refetch()}>
          Retry
        </CommonButton>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) =>
          saveAllowance({ [EmployeeType.WFO]: Number(v[EmployeeType.WFO]), [EmployeeType.HYBRID]: Number(v[EmployeeType.HYBRID]) }),
        )} className="flex max-w-md flex-col gap-4">
        <FormInputWrapper
          form={form}
          fieldConfig={{ name: EmployeeType.WFO, fieldVariant: "numberInput", label: "Work from office (credits per month)" }}
        />
        <FormInputWrapper
          form={form}
          fieldConfig={{ name: EmployeeType.HYBRID, fieldVariant: "numberInput", label: "Hybrid (credits per month)" }}
        />
        <p className="text-sm text-muted-foreground">Applies from this month onward. Past months keep their old value.</p>
        <CommonButton type="submit" disabled={isSaving}>
          Save
        </CommonButton>
      </form>
    </Form>
  );
}
