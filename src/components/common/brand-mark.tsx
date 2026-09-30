import Link from "next/link";
import { Cookie } from "lucide-react";

// Yellow cookie tile + wordmark; links home. Used in the sidebar and the mobile header.
export function BrandMark(): React.JSX.Element {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
      <span className="flex size-10 shrink-0 -rotate-6 items-center justify-center rounded-xl bg-[var(--gos-yellow)] text-[var(--gos-on-yellow)] shadow-[var(--gos-shadow)]">
        <Cookie className="size-5" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-lg font-bold tracking-tight text-[var(--gos-text)]">Snacks</span>
        <span className="text-xs text-[var(--gos-text-muted)]">Credit tracker</span>
      </span>
    </Link>
  );
}
