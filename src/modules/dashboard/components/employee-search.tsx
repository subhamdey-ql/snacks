"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { CommonLoader } from "@/components/common/common-loader";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchResultItem } from "@/modules/dashboard/components/search-result-item";
import { useDashboardAPI } from "@/modules/dashboard/hooks/useDashboardAPI";

interface Props {
  readonly onSelect: (id: number) => void;
}

// Status messages sit on a surface card so they stay readable on the hero gradient.
const NOTE = "rounded-2xl bg-[var(--gos-surface)] py-4 text-center text-sm shadow-[var(--gos-shadow)]";

export function EmployeeSearch({ onSelect }: Props): React.JSX.Element {
  const [text, setText] = useState("");
  // Results show only for a settled, non-empty term; the query is disabled otherwise.
  const term = useDebounce(text.trim());
  const { data, isFetching, isError } = useDashboardAPI().useSearchEmployeesQuery(term);
  const showResults = term.length > 0 && text.trim() === term;

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="employee-search" className="sr-only">Search employee name or code</label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[var(--gos-text-muted)]" aria-hidden />
        <Input
          id="employee-search"
          autoFocus
          autoComplete="off"
          placeholder="Search employee name or code"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-14 rounded-2xl border-transparent bg-[var(--gos-surface)] pl-12 text-base text-[var(--gos-text)] shadow-[var(--gos-shadow-lg)] md:text-lg focus-visible:border-transparent focus-visible:ring-4 focus-visible:ring-[var(--gos-yellow)]/70"
        />
      </div>
      {showResults && isError && <p className={`${NOTE} text-[var(--gos-red)]`}>Could not load employees. Try again.</p>}
      {showResults && isFetching && <div className={NOTE}><CommonLoader /></div>}
      {showResults && !isFetching && data?.data.length === 0 && <p className={`${NOTE} text-[var(--gos-text-muted)]`}>No employee found.</p>}
      {showResults && (
        <div className="stagger flex flex-col gap-2">
          {data?.data.map((e) => <SearchResultItem key={e.id} employee={e} onSelect={onSelect} />)}
        </div>
      )}
    </div>
  );
}
