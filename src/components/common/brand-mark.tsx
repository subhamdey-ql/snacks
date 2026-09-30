import Link from "next/link";
import { BRAND_NAME, BRAND_POWERED_BY, BRAND_TAGLINE } from "@/lib/brand";

// Logo tile: a bitten cookie (the snack) with a small coin (the credits) on the palette's banner gradient.
// The bite and the chips are plain paths, not an SVG mask, because the sidebar and the phone header both render
// this and a mask id shared with a display:none copy would not resolve reliably.
export function LogoGlyph(): React.JSX.Element {
  return (
    <svg viewBox="0 0 40 40" className="size-full" aria-hidden>
      {/* cookie body: full circle minus a bite at the top right */}
      <path d="M31.97 15.93A13 13 0 1 1 25.07 9.03A6 6 0 0 0 31.97 15.93Z" transform="translate(-2 -1)" fill="var(--gos-yellow)" />
      <g fill="var(--gos-primary-dark)" opacity="0.85" transform="translate(-2 -1)">
        <circle cx="14" cy="17" r="1.7" />
        <circle cx="21" cy="24" r="1.9" />
        <circle cx="13.5" cy="27" r="1.4" />
        <circle cx="22" cy="15.5" r="1.3" />
      </g>
      {/* credit coin */}
      <circle cx="31" cy="30" r="6.4" fill="#fff" />
      <circle cx="31" cy="30" r="4.4" fill="none" stroke="var(--gos-primary)" strokeWidth="1.6" />
      <path d="M29.2 30.1l1.3 1.4 2.4-2.8" fill="none" stroke="var(--gos-primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Logo tile + wordmark; links home. Used in the sidebar and the mobile header.
export function BrandMark(): React.JSX.Element {
  return (
    <Link href="/" className="group flex min-h-11 items-center gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
      <span className="flex size-11 shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--gos-hero-from),var(--gos-hero-to))] p-1.5 shadow-[var(--gos-shadow)] ring-1 ring-white/25 transition-transform duration-200 group-hover:rotate-0 motion-reduce:transition-none">
        <LogoGlyph />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="text-xl font-extrabold tracking-tight text-[var(--gos-text)]">{BRAND_NAME}</span>
        <span className="mt-1 text-[11px] font-semibold tracking-[0.12em] text-[var(--gos-primary-text)] uppercase">{BRAND_TAGLINE}</span>
        <span className="mt-0.5 text-[10px] font-medium text-[var(--gos-text-muted)]">{BRAND_POWERED_BY}</span>
      </span>
    </Link>
  );
}
