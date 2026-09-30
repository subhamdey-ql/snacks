import { BrandMark } from "@/components/common/brand-mark";
import { ThemeMenu } from "@/components/common/theme-menu";

// <md only: sticky, translucent top bar, padded clear of the notch/status bar (viewport-fit=cover). `actions` = the icon-only logout control from the layout.
export function MobileHeader({ actions }: { readonly actions?: React.ReactNode }): React.JSX.Element {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-[var(--gos-border)] bg-[var(--gos-page-bg)]/80 pt-[calc(0.625rem+env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-2.5 pl-[max(1rem,env(safe-area-inset-left))] backdrop-blur-md md:hidden">
      <BrandMark />
      <div className="flex items-center gap-2">
        <ThemeMenu side="bottom" align="end" />
        {actions}
      </div>
    </header>
  );
}
