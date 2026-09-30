"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLogout } from "@/modules/auth/hooks/useAuthActions";

// iconOnly = compact mobile-header version (label moves to aria-label); both stay >=40px tall.
export function LogoutButton({ iconOnly = false }: { readonly iconOnly?: boolean }): React.JSX.Element {
  const { logout, isPending } = useLogout();
  return (
    <Button
      variant="ghost"
      aria-label={iconOnly ? "Log out" : undefined}
      className={cn(
        "h-10 rounded-xl text-[var(--gos-text-muted)] hover:bg-[var(--gos-red-light)] hover:text-[var(--gos-red)]",
        iconOnly ? "w-10 px-0" : "gap-2 px-3",
      )}
      onClick={logout}
      disabled={isPending}
    >
      <LogOut className="size-5" aria-hidden />
      {!iconOnly && "Log out"}
    </Button>
  );
}
