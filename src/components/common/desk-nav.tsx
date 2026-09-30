"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/employees", label: "Employees" },
  { href: "/snacks", label: "Snacks" },
  { href: "/settings", label: "Settings" },
  { href: "/reports", label: "Reports" },
];

// `children` = trailing actions (e.g. the logout button), composed by the layout so this shared component imports no module.
export function DeskNav({ children }: { readonly children?: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-b pb-3">
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn("py-2.5 text-sm sm:py-0", active ? "font-semibold text-[var(--gos-blue)]" : "text-muted-foreground")}
          >
            {label}
          </Link>
        );
      })}
      {children}
    </nav>
  );
}
