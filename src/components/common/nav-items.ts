import { BarChart3, ClipboardList, Cookie, Home, Settings, UtensilsCrossed, Users, Wallet, type LucideIcon } from "lucide-react";
import { NavArea } from "@/types/enums";

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

// Single source for the sidebar (md+) and the bottom tab bar (<md), one list per side of the app.
export const NAV_BY_AREA: Readonly<Record<NavArea, readonly NavItem[]>> = {
  [NavArea.ADMIN]: [
    { href: "/", label: "Home", icon: Home },
    { href: "/menu", label: "Menu", icon: ClipboardList },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/snacks", label: "Snacks", icon: Cookie },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  [NavArea.USER]: [
    { href: "/me", label: "Today", icon: UtensilsCrossed },
    { href: "/me/wallet", label: "Wallet", icon: Wallet },
  ],
};

// These are the roots of their area: "/" would match every admin route and "/me" every user route.
const EXACT_ONLY: ReadonlySet<string> = new Set(["/", "/me"]);

export function isNavActive(href: string, pathname: string): boolean {
  return EXACT_ONLY.has(href) ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
