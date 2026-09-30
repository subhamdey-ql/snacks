"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/common/form/form";
import { RecordFields } from "@/modules/dashboard/components/record-fields";
import { CostPreview } from "@/modules/dashboard/components/cost-preview";
import { useDashboardAPI } from "@/modules/dashboard/hooks/useDashboardAPI";
import { useDashboardActions } from "@/modules/dashboard/hooks/useDashboardActions";
import { recordDefaults, recordSchema, type RecordType, type RecordValues } from "@/modules/dashboard/utils/form-utils";

interface Props {
  readonly employeeId: number;
  readonly remaining: number;
}

export function RecordForm({ employeeId, remaining }: Props): React.JSX.Element {
  const { data: snacks = [], isError } = useDashboardAPI().useActiveSnacksQuery();
  const { record, isRecording } = useDashboardActions();
  const form = useForm<RecordValues, unknown, RecordType>({ resolver: zodResolver(recordSchema), defaultValues: recordDefaults() });

  // Snack stays selected (the uncle often repeats it); only qty goes back to 1.
  const onSubmit = (values: RecordType): void =>
    record({ employeeId, snackId: Number(values.snackId), qty: values.qty }, () => form.setValue("qty", 1));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
        {isError && <p className="text-sm text-[var(--gos-red)]">Could not load snacks. Try again.</p>}
        <RecordFields form={form} snacks={snacks} disabled={isRecording || isError} />
        <CostPreview control={form.control} snacks={snacks} remaining={remaining} />
      </form>
    </Form>
  );
}
