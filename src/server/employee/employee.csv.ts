import { EmployeeType } from "@/types/enums";
import { createEmployeeSchema } from "@/server/employee/employee.schema";

export interface CsvEmployeeRow {
  readonly line: number;
  readonly code: string;
  readonly name: string;
  readonly type: EmployeeType;
  readonly email: string;
}

const isEmployeeType = (v: string): v is EmployeeType => Object.values<string>(EmployeeType).includes(v);

// Plain comma split with no quoted fields; add a CSV parser if names ever contain commas.
// Columns: code,name,WFO|HYBRID,email. The email is required (it is the person's login).
export function parseEmployeeCsv(text: string): { rows: CsvEmployeeRow[]; errors: string[] } {
  const rows: CsvEmployeeRow[] = [];
  const errors: string[] = [];
  const lineOfEmail = new Map<string, number>();
  // Strip a BOM (Excel adds one) and accept both LF and CRLF.
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    const [code = "", name = "", rawType = "", email = ""] = line.split(",").map((x) => x.trim());
    const type = rawType.toUpperCase();
    if (i === 0 && code.toLowerCase() === "code") return; // header row
    if (!code || !name || !email || !isEmployeeType(type)) {
      errors.push(`Line ${i + 1}: expected code,name,WFO|HYBRID,email`);
      return;
    }
    if (code.length > 30 || name.length > 100) {
      errors.push(`Line ${i + 1}: ${code.length > 30 ? "code must be at most 30 characters" : "name must be at most 100 characters"}`);
      return;
    }
    const parsed = createEmployeeSchema.safeParse({ code, name, type, email });
    if (!parsed.success) {
      errors.push(`Line ${i + 1}: ${parsed.error.issues[0]?.message ?? "invalid row"}`);
      return;
    }
    // One email can belong to one person: a repeat inside the file is reported, the first occurrence wins.
    const first = lineOfEmail.get(parsed.data.email);
    if (first !== undefined) {
      errors.push(`Line ${i + 1}: email already used on line ${first}`);
      return;
    }
    lineOfEmail.set(parsed.data.email, i + 1);
    rows.push({ line: i + 1, ...parsed.data });
  });
  return { rows, errors };
}
