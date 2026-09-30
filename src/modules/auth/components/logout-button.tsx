"use client";

import { Button } from "@/components/ui/button";
import { useLogout } from "@/modules/auth/hooks/useAuthActions";

export function LogoutButton(): React.JSX.Element {
  const { logout, isPending } = useLogout();
  return (
    <Button variant="ghost" className="ml-auto h-10 sm:h-8" onClick={logout} disabled={isPending}>
      Log out
    </Button>
  );
}
