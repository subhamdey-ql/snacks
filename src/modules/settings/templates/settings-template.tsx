"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Laptop } from "lucide-react";
import { CommonButton } from "@/components/common/common-button";
import { CommonLoader } from "@/components/common/common-loader";
import { Form } from "@/components/common/form/form";
import { InlineNotice } from "@/components/common/inline-notice";
import { PageHeader } from "@/components/common/page-header";
import { AllowanceCard } from "@/modules/settings/components/allowance-card";
import { useAllowanceActions } from "@/modules/settings/hooks/useAllowanceActions";
import { useAllowanceAPI } from "@/modules/settings/hooks/useAllowanceAPI";
import {
  allowanceDefaults,
  allowanceSchema,
  type AllowanceFormValues,
} from "@/modules/settings/utils/form-utils";
import { BadgeTone, EmployeeType } from "@/types/enums";

export function SettingsTemplate(): React.JSX.Element {
  const { data, isLoading, isError, refetch } = useAllowanceAPI().useGetAllowanceQuery();
  const { saveAllowance, isSaving } = useAllowanceActions();
  // `values` refills the form when the query resolves (numbers become strings for the inputs).
  const form = useForm<AllowanceFormValues>({
    resolver: zodResolver(allowanceSchema),
    defaultValues: allowanceDefaults(),
    values: data ? allowanceDefaults(data) : undefined,
  });

  const header = <PageHeader title="Settings" description="Monthly credits for each employee type" />;

  if (isLoading) return <>{header}<CommonLoader /></>;
  // Never show (or allow saving) the form until the current values have loaded.
  if (isError || !data) {
    return (
      <>
        {header}
        <div className="flex max-w-md flex-col items-start gap-3">
          <InlineNotice tone={BadgeTone.DANGER}>Could not load the monthly credits.</InlineNotice>
          <CommonButton type="button" onClick={() => refetch()}>
            Retry
          </CommonButton>
        </div>
      </>
    );
  }

  return (
    <div className="stagger flex min-w-0 flex-col gap-4">
      {header}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v) =>
            saveAllowance({ [EmployeeType.WFO]: Number(v[EmployeeType.WFO]), [EmployeeType.HYBRID]: Number(v[EmployeeType.HYBRID]) }),
          )}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <AllowanceCard
              form={form}
              type={EmployeeType.WFO}
              icon={Building2}
              title="Work from office"
              subtitle="In the office every day"
              label="Work from office (credits per month)"
            />
            <AllowanceCard
              form={form}
              type={EmployeeType.HYBRID}
              icon={Laptop}
              title="Hybrid"
              subtitle="Split between home and office"
              label="Hybrid (credits per month)"
            />
          </div>
          <InlineNotice tone={BadgeTone.INFO}>Applies from this month onward. Past months keep their old value.</InlineNotice>
          <CommonButton type="submit" className="w-full sm:h-10 sm:w-fit sm:px-6" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </CommonButton>
        </form>
      </Form>
    </div>
  );
}
