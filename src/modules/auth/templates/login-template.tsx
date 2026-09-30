"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { CommonButton } from "@/components/common/common-button";
import { Form } from "@/components/common/form/form";
import { FormInputWrapper } from "@/components/common/form/form-input-wrapper";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { LoginBrandPanel } from "@/modules/auth/components/login-brand-panel";
import { useLogin } from "@/modules/auth/hooks/useAuthActions";
import { loginDefaults, loginSchema, type LoginFormType } from "@/modules/auth/utils/form-utils";

// Split screen from lg (brand left, card right); on phones the card overlaps the bottom of the brand banner.
export function LoginTemplate(): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isPending } = useLogin();
  const form = useForm<LoginFormType>({ resolver: zodResolver(loginSchema), defaultValues: loginDefaults() });

  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <LoginBrandPanel />
      <div className="relative -mt-12 flex flex-1 justify-center px-4 pb-10 lg:mt-0 lg:items-center lg:px-10">
        <Card className="animate-fade-in-up h-fit w-full max-w-sm gap-5 py-6 shadow-[var(--gos-shadow-lg)]">
          <CardHeader className="px-6">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--gos-text)]">Welcome back</h1>
            <CardDescription>Enter the admin password to open the tracker.</CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(login)} className="flex flex-col gap-5">
                <FormInputWrapper
                  form={form}
                  fieldConfig={{
                    name: "password",
                    fieldVariant: "passwordInput",
                    label: "Password",
                    showPassword,
                    handlePasswordVisibility: () => setShowPassword((v) => !v),
                  }}
                />
                <CommonButton type="submit" className="h-11 w-full gap-2 text-base sm:h-11" disabled={isPending}>
                  {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  {isPending ? "Logging in…" : "Log in"}
                </CommonButton>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
