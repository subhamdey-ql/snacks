"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CommonButton } from "@/components/common/common-button";
import { Form } from "@/components/common/form/form";
import { FormInputWrapper } from "@/components/common/form/form-input-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLogin } from "@/modules/auth/hooks/useAuthActions";
import { loginDefaults, loginSchema, type LoginFormType } from "@/modules/auth/utils/form-utils";

export function LoginTemplate(): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isPending } = useLogin();
  const form = useForm<LoginFormType>({ resolver: zodResolver(loginSchema), defaultValues: loginDefaults() });

  return (
    <div className="px-4">
    <Card className="mx-auto mt-16 w-full max-w-sm">
      <CardHeader>
        <CardTitle>Snacks Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(login)} className="flex flex-col gap-4">
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
            <CommonButton type="submit" disabled={isPending}>
              Log in
            </CommonButton>
          </form>
        </Form>
      </CardContent>
    </Card>
    </div>
  );
}
