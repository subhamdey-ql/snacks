// India has no DST, so a fixed +05:30 offset is exact.
const IST_OFFSET_MS = 330 * 60 * 1000;

// [start, end) of the IST calendar month containing `d`.
export function monthRange(d: Date): { start: Date; end: Date } {
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  return {
    start: new Date(Date.UTC(y, m, 1) - IST_OFFSET_MS),
    end: new Date(Date.UTC(y, m + 1, 1) - IST_OFFSET_MS),
  };
}

// "YYYY-MM-DD" of the IST calendar day containing `d`.
export function dayLabel(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

// "YYYY-MM" of the IST month containing `d`.
export function monthLabel(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 7);
}

// Any instant inside the requested IST month; falls back to `now` for a missing/invalid value.
export function monthFromParam(m: string | null, now = new Date()): Date {
  const hit = m ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(m) : null;
  if (!hit) return now;
  // Mid-month noon UTC is far from any IST month boundary.
  return new Date(Date.UTC(Number(hit[1]), Number(hit[2]) - 1, 15, 12));
}

// [start, end) of the IST calendar day containing `d`.
export function dayRange(d: Date): { start: Date; end: Date } {
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  const day = ist.getUTCDate();
  return {
    start: new Date(Date.UTC(y, m, day) - IST_OFFSET_MS),
    end: new Date(Date.UTC(y, m, day + 1) - IST_OFFSET_MS),
  };
}
