"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useCountdown } from "@/hooks/useCountdown";
import { LoginBrandPanel } from "@/modules/auth/components/login-brand-panel";
import { LoginCodeForm } from "@/modules/auth/components/login-code-form";
import { LoginEmailForm } from "@/modules/auth/components/login-email-form";
import { useRequestOtp, useVerifyOtp } from "@/modules/auth/hooks/useAuthActions";
import { RESEND_SECONDS } from "@/modules/auth/utils/form-utils";

// Split screen from lg (brand left, card right); on phones the card overlaps the bottom of the brand banner.
// Two steps in one card: email first, then the code that was emailed (email === null means step 1).
export function LoginTemplate(): React.JSX.Element {
  const [email, setEmail] = useState<string | null>(null);
  // Local development only: the server sends the code back so it can be shown on screen (see the request route).
  const [devCode, setDevCode] = useState<string | null>(null);
  const { left, start } = useCountdown();
  const { requestCode, isSending } = useRequestOtp();
  const { verifyCode, isVerifying } = useVerifyOtp();

  const sendTo = (address: string): void =>
    requestCode({ email: address }, (result) => {
      setEmail(address);
      // A request inside the 60 s cooldown issues no new code, so keep showing the one already issued.
      if (result.devCode) setDevCode(result.devCode);
      start(RESEND_SECONDS);
    });

  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <LoginBrandPanel />
      <div className="relative -mt-12 flex flex-1 justify-center pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(2.5rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] lg:mt-0 lg:items-center lg:px-10">
        <Card className="animate-fade-in-up h-fit w-full max-w-sm gap-5 py-6 shadow-[var(--gos-shadow-lg)]">
          <CardHeader className="px-6">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--gos-text)]">Welcome back</h1>
            <CardDescription>{email === null ? "Enter your work email and we'll send you a login code." : "Enter the code from your email."}</CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            {email === null ? (
              <LoginEmailForm isSending={isSending} onSubmit={sendTo} />
            ) : (
              <LoginCodeForm
                email={email}
                devCode={devCode}
                isVerifying={isVerifying}
                isResending={isSending}
                resendIn={left}
                onSubmit={(code) => verifyCode({ email, code })}
                onResend={() => sendTo(email)}
                onChangeEmail={() => {
                  setEmail(null);
                  setDevCode(null);
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
