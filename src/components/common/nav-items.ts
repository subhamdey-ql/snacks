import { BarChart3, Cookie, Home, Settings, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

// Single source for the sidebar (md+) and the bottom tab bar (<md).
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/snacks", label: "Snacks", icon: Cookie },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

// "/" must match exactly, otherwise it would be active on every route.
export function isNavActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
