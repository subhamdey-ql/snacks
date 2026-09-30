import { AppSidebar } from "@/components/common/app-sidebar";
import { MobileBottomNav } from "@/components/common/mobile-bottom-nav";
import { MobileHeader } from "@/components/common/mobile-header";
import { LogoutButton } from "@/modules/auth/components/logout-button";
import { requireAuth } from "@/server/auth/session";

// Sidebar on md+, sticky header + bottom tab bar below md. The bottom padding keeps content (the last button of a
// form included) clear of the 64px tab bar plus the home-bar inset; side padding clears landscape notches.
export default async function DeskLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  await requireAuth(); // redirects to /login without a valid session
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppSidebar footer={<LogoutButton />} />
      <MobileHeader actions={<LogoutButton iconOnly />} />
      <main className="flex min-w-0 flex-1 flex-col md:pl-64">
        <div className="mx-auto w-full max-w-5xl min-w-0 pt-6 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(7rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] md:py-8 md:pr-[max(2rem,env(safe-area-inset-right))] md:pl-8">{children}</div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
