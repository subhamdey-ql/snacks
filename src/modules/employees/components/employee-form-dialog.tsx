"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CommonButton } from "@/components/common/common-button";
import { Form } from "@/components/common/form/form";
import { FormInputWrapper } from "@/components/common/form/form-input-wrapper";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
        <DialogHeader>
          <DialogTitle>{employee ? "Edit employee" : "Add employee"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormInputWrapper form={form} fieldConfig={{ name: "code", fieldVariant: "input", label: "Code" }} />
            <FormInputWrapper form={form} fieldConfig={{ name: "name", fieldVariant: "input", label: "Name" }} />
            <FormInputWrapper
              form={form}
              fieldConfig={{ name: "type", fieldVariant: "selectField", label: "Type", options: employeeTypeOptions, placeHolder: "Type" }}
            />
            <CommonButton type="submit" disabled={isSaving}>
              Save
            </CommonButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
