import { FoodPattern } from "@/components/common/food-pattern";

interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly actions?: React.ReactNode;
}

// Every page heading sits on the same tomato-orange gradient banner as the dashboard hero, with faint food outlines
// on its right side (so they never sit behind the title). Actions go in a row under the banner, right-aligned from sm,
// so buttons never share a background with the gradient.
export function PageHeader({ title, description, actions }: PageHeaderProps): React.JSX.Element {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--gos-hero-from),var(--gos-hero-to))] px-5 py-6 shadow-[var(--gos-shadow-lg)] sm:px-8 sm:py-8">
        <FoodPattern className="left-auto w-1/2 sm:w-2/5" />
        <div aria-hidden className="pointer-events-none absolute -top-14 -right-10 size-44 rounded-full bg-[var(--gos-yellow)] opacity-25 blur-2xl" />
        <div className="relative min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--gos-hero-ink)] [overflow-wrap:anywhere] md:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-[var(--gos-hero-ink-muted)] md:text-base">{description}</p>}
        </div>
      </section>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
}
