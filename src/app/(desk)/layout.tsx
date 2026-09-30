import { AppShell } from "@/components/common/app-shell";
import { LogoutButton } from "@/modules/auth/components/logout-button";
import { requireRole } from "@/server/auth/session";
import { NavArea, Role } from "@/types/enums";

export default async function DeskLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  await requireRole(Role.ADMIN); // signed out -> /login, employee -> /me
  return (
    <AppShell area={NavArea.ADMIN} sidebarFooter={<LogoutButton />} headerActions={<LogoutButton iconOnly />}>
      {children}
    </AppShell>
  );
}
