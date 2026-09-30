import { route } from "@/server/http";
import { getReport } from "@/server/report/report.service";

// Text cells starting with these are read as formulas by Excel/Sheets; a leading quote defuses them.
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(v: string | number): string {
  const s = typeof v === "string" && FORMULA_START.test(v) ? `'${v}` : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function toCsv(rows: readonly (string | number)[][]): string {
  return rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

export const GET = route(async (req) => {
  const report = await getReport(new URL(req.url).searchParams.get("m"));
  const csv = toCsv([
    ["Code", "Name", "Allowance", "Used", "Remaining"],
    ...report.perEmployee.map((e) => [e.code, e.name, e.allowance, e.used, e.remaining]),
    [],
    ["Snack", "Qty", "Credits"],
    ...report.perSnack.map((s) => [s.name, s.qty, s.credits]),
  ]);
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="snacks-${report.month}.csv"`,
    },
  });
});
