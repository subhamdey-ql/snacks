import { EmployeeSearch } from "@/modules/dashboard/components/employee-search";

interface Props {
  readonly onSelect: (id: number) => void;
}

// Home hero: brand gradient, two soft decorative blobs, the headline, then the search.
export function HeroSearch({ onSelect }: Props): React.JSX.Element {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--gos-hero-from),var(--gos-hero-to))] px-4 py-7 shadow-[var(--gos-shadow-lg)] sm:px-8 sm:py-10">
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-12 size-56 rounded-full bg-[var(--gos-yellow)] opacity-30 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-white opacity-10 blur-xl" />
      <div className="relative flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">Who&apos;s grabbing a snack?</h1>
          <p className="mt-1.5 text-sm text-white/80 sm:text-base">Find the employee by name or code, then record what they take.</p>
        </div>
        <EmployeeSearch onSelect={onSelect} />
      </div>
    </section>
  );
}
