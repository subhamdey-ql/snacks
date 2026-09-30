"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { CommonButton } from "@/components/common/common-button";
import { Form } from "@/components/common/form/form";
import { FormInputWrapper } from "@/components/common/form/form-input-wrapper";
import { InlineNotice } from "@/components/common/inline-notice";
import { Button } from "@/components/ui/button";
import { BadgeTone } from "@/types/enums";
import { codeFormDefaults, codeFormSchema, type CodeFormType } from "@/modules/auth/utils/form-utils";

interface Props {
  readonly email: string;
  // Set only in local development, when the server hands the code back instead of emailing it.
  readonly devCode: string | null;
  readonly isVerifying: boolean;
  readonly isResending: boolean;
  // Seconds until a new code may be requested (0 = allowed now).
  readonly resendIn: number;
  readonly onSubmit: (code: string) => void;
  readonly onResend: () => void;
  readonly onChangeEmail: () => void;
}

// Step 2: type the 6-digit code from the email. One-time-code autofill lets phones fill it from the message.
export function LoginCodeForm({ email, devCode, isVerifying, isResending, resendIn, onSubmit, onResend, onChangeEmail }: Props): React.JSX.Element {
  const form = useForm<CodeFormType>({ resolver: zodResolver(codeFormSchema), defaultValues: codeFormDefaults() });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(({ code }) => onSubmit(code))} className="flex flex-col gap-5">
        <p className="text-sm text-[var(--gos-text-muted)] [overflow-wrap:anywhere]">
          If <span className="font-medium text-[var(--gos-text)]">{email}</span> is registered, we sent a 6-digit code. It expires in 10 minutes.
        </p>
        {devCode && (
          <InlineNotice tone={BadgeTone.INFO}>
            Development mode: your code is <span className="font-bold tracking-widest tabular-nums">{devCode}</span>
          </InlineNotice>
        )}
        <FormInputWrapper
          form={form}
          fieldConfig={{ name: "code", fieldVariant: "input", label: "Code", placeHolder: "123456", inputMode: "numeric", autoComplete: "one-time-code", maxLength: 6 }}
        />
        <CommonButton type="submit" className="h-12 w-full gap-2 text-base md-fine:h-12" disabled={isVerifying}>
          {isVerifying && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {isVerifying ? "Checking…" : "Log in"}
        </CommonButton>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="ghost" className="h-11 px-3 md-fine:h-10" onClick={onChangeEmail}>
            Use a different email
          </Button>
          <Button type="button" variant="ghost" className="h-11 px-3 md-fine:h-10" disabled={resendIn > 0 || isResending} onClick={onResend}>
            {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
