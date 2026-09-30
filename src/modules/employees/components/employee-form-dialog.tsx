"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPen, UserPlus } from "lucide-react";
import { CommonButton } from "@/components/common/common-button";
import { Form } from "@/components/common/form/form";
import { FormDialogHeader } from "@/components/common/form-dialog-header";
import { FormInputWrapper } from "@/components/common/form/form-input-wrapper";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { useEmployeeActions } from "@/modules/employees/hooks/useEmployeeActions";
import type { Employee } from "@/modules/employees/types";
import {
  employeeDefaults,
  employeeSchema,
  employeeTypeOptions,
  type EmployeeFormType,
  type EmployeeFormValues,
} from "@/modules/employees/utils/form-utils";

interface Props {
  readonly open: boolean;
  readonly employee?: Employee;
  readonly onClose: () => void;
}

// Add (no employee) and Edit (employee) share one form.
export function EmployeeFormDialog({ open, employee, onClose }: Props): React.JSX.Element {
  const { saveEmployee, isSaving } = useEmployeeActions();
  const form = useForm<EmployeeFormValues, unknown, EmployeeFormType>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employeeDefaults(employee),
  });

  useEffect(() => {
    if (open) form.reset(employeeDefaults(employee));
  }, [open, employee, form]);

  const onSubmit = (values: EmployeeFormType): void => saveEmployee({ ...values, id: employee?.id }, onClose);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <FormDialogHeader
          icon={employee ? UserPen : UserPlus}
          title={employee ? "Edit employee" : "Add employee"}
          description={employee ? "Update their details. Past snack entries stay as they are." : "They can take snacks as soon as you save."}
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormInputWrapper form={form} fieldConfig={{ name: "code", fieldVariant: "input", label: "Code" }} />
            <FormInputWrapper form={form} fieldConfig={{ name: "name", fieldVariant: "input", label: "Name" }} />
            <FormInputWrapper
              form={form}
              fieldConfig={{ name: "type", fieldVariant: "selectField", label: "Type", options: employeeTypeOptions, placeHolder: "Type" }}
            />
            <DialogFooter className="mt-2">
              <DialogClose render={<Button variant="ghost" className="h-11 md-fine:h-10" />}>Cancel</DialogClose>
              <CommonButton type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Save"}
              </CommonButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
