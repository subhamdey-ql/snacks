import { DeskNav } from "@/components/common/desk-nav";
import { LogoutButton } from "@/modules/auth/components/logout-button";
import { requireAuth } from "@/server/auth/session";

export default async function DeskLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  await requireAuth(); // redirects to /login without a valid session
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl p-4">
      <DeskNav>
        <LogoutButton />
      </DeskNav>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
