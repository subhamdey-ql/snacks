import { Cookie } from "lucide-react";
import { FoodPattern } from "@/components/common/food-pattern";

// Brand side of the login screen: hero gradient, the tilted yellow cookie tile, tagline and soft shapes.
// Compact banner on phones (the login card overlaps its bottom edge); full-height left panel from lg.
export function LoginBrandPanel(): React.JSX.Element {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,var(--gos-hero-from),var(--gos-hero-to))] pt-[calc(2.5rem+env(safe-area-inset-top))] pr-[max(1.5rem,env(safe-area-inset-right))] pb-20 pl-[max(1.5rem,env(safe-area-inset-left))] text-white lg:flex lg:flex-col lg:justify-center lg:px-14 lg:py-16">
      <FoodPattern />
      {/* Decorative only: a warm glow, a faint ring and two floating "crumbs". */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white opacity-15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full border-[40px] border-white/10" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 right-10 hidden size-10 rotate-12 rounded-xl bg-[var(--gos-yellow)] shadow-[var(--gos-shadow-lg)] lg:block" />
      <div aria-hidden className="pointer-events-none absolute right-24 bottom-24 hidden size-5 -rotate-12 rounded-md bg-white/25 lg:block" />
      <div className="relative mx-auto flex max-w-sm flex-col items-center gap-4 text-center lg:mx-0 lg:max-w-md lg:items-start lg:gap-6 lg:text-left">
        <span aria-hidden className="flex size-14 -rotate-6 items-center justify-center rounded-2xl bg-[var(--gos-yellow)] text-[var(--gos-on-yellow)] shadow-[var(--gos-shadow-lg)] lg:size-20 lg:rounded-3xl">
          <Cookie className="size-7 lg:size-10" strokeWidth={2.25} />
        </span>
        <div>
          <p className="text-sm font-semibold text-white/75 lg:text-base">Snacks credit tracker</p>
          <p className="mt-1 text-2xl font-bold tracking-tight lg:text-5xl lg:leading-tight">Track every snack, effortlessly</p>
          <p className="mt-4 hidden text-base text-white/80 lg:block">
            Record what the team takes from the counter and keep every monthly allowance in check.
          </p>
        </div>
      </div>
    </section>
  );
}
