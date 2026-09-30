import { AppShell } from "@/components/common/app-shell";
import { LogoutButton } from "@/modules/auth/components/logout-button";
import { requireRole } from "@/server/auth/session";
import { NavArea, Role } from "@/types/enums";

export default async function MeLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  await requireRole(Role.USER); // signed out -> /login, admin -> /
  return (
    <AppShell area={NavArea.USER} sidebarFooter={<LogoutButton />} headerActions={<LogoutButton iconOnly />}>
      {children}
    </AppShell>
  );
}
