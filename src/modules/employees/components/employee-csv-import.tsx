"use client";

import { useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { CommonButton } from "@/components/common/common-button";
import { Input } from "@/components/ui/input";
import { useEmployeeActions } from "@/modules/employees/hooks/useEmployeeActions";
import { EMPLOYEE_CSV_INPUT_ID } from "@/modules/employees/utils/employee-display";

// Dashed "drop zone" look around a real file input (no drag-and-drop logic: the native picker does the work).
export function EmployeeCsvImport(): React.JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const { importEmployees, isImporting } = useEmployeeActions();

  // Bumping the key remounts the file input so it clears after a successful import.
  const onImport = (): void => {
    if (!file) return;
    importEmployees(file, () => {
      setFile(null);
      setInputKey((k) => k + 1);
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-[var(--gos-border)] bg-[var(--gos-surface-muted)] p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gos-yellow-light)] text-[var(--gos-orange)]">
          <FileSpreadsheet className="size-5" />
        </span>
        <div className="min-w-0">
          <label htmlFor={EMPLOYEE_CSV_INPUT_ID} className="font-semibold text-[var(--gos-text)]">
            Import from a CSV file
          </label>
          <p className="text-sm text-[var(--gos-text-muted)] [overflow-wrap:anywhere]">
            One employee per line: <span className="font-medium text-[var(--gos-text)]">code,name,WFO|HYBRID</span>. Up to 1 MB and 5000 rows.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          key={inputKey}
          id={EMPLOYEE_CSV_INPUT_ID}
          type="file"
          accept=".csv"
          className="h-11 min-w-0 pt-2.5 sm:flex-1"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <CommonButton className="gap-1.5" disabled={!file || isImporting} onClick={onImport}>
          <Upload className="size-4" aria-hidden />
          {isImporting ? "Importing…" : "Import"}
        </CommonButton>
      </div>
    </div>
  );
}
