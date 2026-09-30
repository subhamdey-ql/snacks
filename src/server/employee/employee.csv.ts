import { EmployeeType } from "@/types/enums";
import { createEmployeeSchema } from "@/server/employee/employee.schema";

export interface CsvEmployeeRow {
  readonly code: string;
  readonly name: string;
  readonly type: EmployeeType;
}

const isEmployeeType = (v: string): v is EmployeeType => Object.values<string>(EmployeeType).includes(v);

// Plain comma split with no quoted fields; add a CSV parser if names ever contain commas.
export function parseEmployeeCsv(text: string): { rows: CsvEmployeeRow[]; errors: string[] } {
  const rows: CsvEmployeeRow[] = [];
  const errors: string[] = [];
  // Strip a BOM (Excel adds one) and accept both LF and CRLF.
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    const [code = "", name = "", rawType = ""] = line.split(",").map((x) => x.trim());
    const type = rawType.toUpperCase();
    if (i === 0 && code.toLowerCase() === "code") return; // header row
    if (!code || !name || !isEmployeeType(type)) {
      errors.push(`Line ${i + 1}: expected code,name,WFO|HYBRID`);
      return;
    }
    if (code.length > 30 || name.length > 100) {
      errors.push(`Line ${i + 1}: ${code.length > 30 ? "code must be at most 30 characters" : "name must be at most 100 characters"}`);
      return;
    }
    const parsed = createEmployeeSchema.safeParse({ code, name, type });
    if (!parsed.success) {
      errors.push(`Line ${i + 1}: ${parsed.error.issues[0]?.message ?? "invalid row"}`);
      return;
    }
    rows.push(parsed.data);
  });
  return { rows, errors };
}
