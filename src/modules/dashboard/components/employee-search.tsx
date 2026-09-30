"use client";

import { useState } from "react";
import { CommonLoader } from "@/components/common/common-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useDashboardAPI } from "@/modules/dashboard/hooks/useDashboardAPI";

interface Props {
  readonly onSelect: (id: number) => void;
}

export function EmployeeSearch({ onSelect }: Props): React.JSX.Element {
  const [text, setText] = useState("");
  // Results show only for a settled, non-empty term; the query is disabled otherwise.
  const term = useDebounce(text.trim());
  const { data, isFetching, isError } = useDashboardAPI().useSearchEmployeesQuery(term);
  const showResults = term.length > 0 && text.trim() === term;

  return (
    <div className="flex flex-col gap-3">
      <Input autoFocus placeholder="Search employee name or code" value={text} onChange={(e) => setText(e.target.value)} />
      {showResults && isError && <p className="py-4 text-center text-sm text-[var(--gos-red)]">Could not load employees. Try again.</p>}
      {showResults && isFetching && <CommonLoader />}
      {showResults && !isFetching && data?.data.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No employee found.</p>}
      {showResults && (
        <div className="flex flex-col gap-2">
          {data?.data.map((e) => (
            <Button key={e.id} variant="outline" className="h-auto min-h-12 w-full min-w-0 justify-start whitespace-normal [overflow-wrap:anywhere] py-2 text-left text-base" onClick={() => onSelect(e.id)}>
              {e.name} ({e.code} · {e.type})
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
