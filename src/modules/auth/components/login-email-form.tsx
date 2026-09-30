"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { CommonButton } from "@/components/common/common-button";
import { Form } from "@/components/common/form/form";
import { FormInputWrapper } from "@/components/common/form/form-input-wrapper";
import { emailFormDefaults, emailFormSchema, type EmailFormType } from "@/modules/auth/utils/form-utils";

interface Props {
  readonly isSending: boolean;
  readonly onSubmit: (email: string) => void;
}

// Step 1: ask for the work email; the code is sent on submit.
export function LoginEmailForm({ isSending, onSubmit }: Props): React.JSX.Element {
  const form = useForm<EmailFormType>({ resolver: zodResolver(emailFormSchema), defaultValues: emailFormDefaults() });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(({ email }) => onSubmit(email))} className="flex flex-col gap-5">
        <FormInputWrapper
          form={form}
          fieldConfig={{ name: "email", fieldVariant: "input", label: "Email", placeHolder: "name@company.com", type: "email", inputMode: "email", autoComplete: "email" }}
        />
        <CommonButton type="submit" className="h-12 w-full gap-2 text-base md-fine:h-12" disabled={isSending}>
          {isSending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {isSending ? "Sending code…" : "Send code"}
        </CommonButton>
      </form>
    </Form>
  );
}
