"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isNavActive } from "@/components/common/nav-items";
import { cn } from "@/lib/utils";

// <md only: fixed tab bar; each tab is a full-height (>=64px) tap target, 8px apart. Safe-area padding clears the
// iOS home bar and landscape notches.
export function MobileBottomNav(): React.JSX.Element {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--gos-border)] bg-[var(--gos-surface)]/90 pr-[max(0.5rem,env(safe-area-inset-right))] pb-[env(safe-area-inset-bottom)] pl-[max(0.5rem,env(safe-area-inset-left))] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5 gap-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(href, pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150 outline-none focus-visible:bg-[var(--gos-surface-muted)]",
                  active ? "text-[var(--gos-blue-text)]" : "text-[var(--gos-text-muted)]",
                )}
              >
                <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150", active && "bg-[var(--gos-blue-light)]")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
