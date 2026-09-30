"use client";

import { useState } from "react";
import { CommonButton } from "@/components/common/common-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEmployeeActions } from "@/modules/employees/hooks/useEmployeeActions";

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
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input key={inputKey} type="file" accept=".csv" className="w-full sm:w-auto" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <CommonButton disabled={!file || isImporting} onClick={onImport}>
            Import CSV
          </CommonButton>
        </div>
        <p className="text-xs text-muted-foreground">Columns: code,name,WFO|HYBRID</p>
      </CardContent>
    </Card>
  );
}
