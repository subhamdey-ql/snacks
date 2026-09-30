"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cookie } from "lucide-react";
import { CommonButton } from "@/components/common/common-button";
import { Form } from "@/components/common/form/form";
import { FormDialogHeader } from "@/components/common/form-dialog-header";
import { FormInputWrapper } from "@/components/common/form/form-input-wrapper";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { useSnackActions } from "@/modules/snacks/hooks/useSnackActions";
import type { Snack } from "@/modules/snacks/types";
import { snackDefaults, snackSchema, type SnackFormType, type SnackFormValues } from "@/modules/snacks/utils/form-utils";

interface Props {
  readonly open: boolean;
  readonly snack?: Snack;
  readonly onClose: () => void;
}

// Add (no snack) and Edit (snack) share one form.
export function SnackFormDialog({ open, snack, onClose }: Props): React.JSX.Element {
  const { saveSnack, isSaving } = useSnackActions();
  const form = useForm<SnackFormValues, unknown, SnackFormType>({
    resolver: zodResolver(snackSchema),
    defaultValues: snackDefaults(snack),
  });

  useEffect(() => {
    if (open) form.reset(snackDefaults(snack));
  }, [open, snack, form]);

  const onSubmit = (values: SnackFormType): void => saveSnack({ ...values, id: snack?.id }, onClose);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <FormDialogHeader
          icon={Cookie}
          title={snack ? "Edit snack" : "Add snack"}
          description={snack ? "A new price applies to future entries only." : "Set how many credits one of these costs."}
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormInputWrapper form={form} fieldConfig={{ name: "name", fieldVariant: "input", label: "Name" }} />
            <FormInputWrapper form={form} fieldConfig={{ name: "credits", fieldVariant: "numberInput", label: "Credits" }} />
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
