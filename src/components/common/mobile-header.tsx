import { BrandMark } from "@/components/common/brand-mark";
import { ThemeToggle } from "@/components/common/theme-toggle";

// <md only: sticky, translucent top bar. `actions` = the icon-only logout control from the layout.
export function MobileHeader({ actions }: { readonly actions?: React.ReactNode }): React.JSX.Element {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-[var(--gos-border)] bg-[var(--gos-page-bg)]/80 px-4 py-2.5 backdrop-blur-md md:hidden">
      <BrandMark />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        {actions}
      </div>
    </header>
  );
}
