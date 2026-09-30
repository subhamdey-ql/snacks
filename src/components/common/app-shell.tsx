import { AppSidebar } from "@/components/common/app-sidebar";
import { MobileBottomNav } from "@/components/common/mobile-bottom-nav";
import { MobileHeader } from "@/components/common/mobile-header";
import type { NavArea } from "@/types/enums";

interface Props {
  readonly area: NavArea;
  // The logout controls are composed by the layout so this shared component imports no module.
  readonly sidebarFooter: React.ReactNode;
  readonly headerActions: React.ReactNode;
  readonly children: React.ReactNode;
}

// Sidebar on md+, sticky header + bottom tab bar below md. The bottom padding keeps content (the last button of a
// form included) clear of the 64px tab bar plus the home-bar inset; side padding clears landscape notches.
export function AppShell({ area, sidebarFooter, headerActions, children }: Props): React.JSX.Element {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppSidebar area={area} footer={sidebarFooter} />
      <MobileHeader actions={headerActions} />
      <main className="flex min-w-0 flex-1 flex-col md:pl-64">
        <div className="w-full min-w-0 pt-6 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(7rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] md:py-8 md:pr-[max(2rem,env(safe-area-inset-right))] md:pl-8">{children}</div>
      </main>
      <MobileBottomNav area={area} />
    </div>
  );
}
