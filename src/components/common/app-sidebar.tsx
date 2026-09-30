"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/common/brand-mark";
import { NAV_ITEMS, isNavActive } from "@/components/common/nav-items";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { cn } from "@/lib/utils";

// `footer` = the logout control, composed by the layout so this shared component imports no module.
export function AppSidebar({ footer }: { readonly footer?: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[var(--gos-border)] bg-[var(--gos-surface)] py-6 pr-4 pl-[max(1rem,env(safe-area-inset-left))] md:flex">
      <div className="px-2">
        <BrandMark />
      </div>
      <nav aria-label="Main" className="mt-8 flex flex-1 flex-col gap-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/35",
                active
                  ? "bg-[var(--gos-blue-light)] text-[var(--gos-blue-text)] before:absolute before:inset-y-2.5 before:left-0 before:w-1 before:rounded-full before:bg-[var(--gos-blue)]"
                  : "text-[var(--gos-text-muted)] hover:bg-[var(--gos-surface-muted)] hover:text-[var(--gos-text)]",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center justify-between gap-2 border-t border-[var(--gos-border)] pt-4">
        {footer}
        <ThemeToggle />
      </div>
    </aside>
  );
}
