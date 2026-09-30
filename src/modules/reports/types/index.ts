export interface EmployeeReportRow {
  readonly code: string;
  readonly name: string;
  readonly allowance: number;
  readonly used: number;
  readonly remaining: number;
}

export interface SnackReportRow {
  readonly name: string;
  readonly qty: number;
  readonly credits: number;
}

export interface Report {
  readonly month: string;
  readonly perEmployee: readonly EmployeeReportRow[];
  readonly perSnack: readonly SnackReportRow[];
}
