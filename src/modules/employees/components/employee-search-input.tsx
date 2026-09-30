import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

// Controlled by the template, which owns the debounce + URL sync.
export function EmployeeSearchInput({ value, onChange }: Props): React.JSX.Element {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--gos-text-muted)]" />
      <Input
        aria-label="Search name or code"
        className="pl-10"
        placeholder="Search name or code"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
