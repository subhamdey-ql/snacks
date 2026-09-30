// "2026-10-01" (an IST calendar day from the API) -> "Thu, 1 Oct". Formatted in UTC because the label is already the IST date.
export const formatDay = (label: string): string =>
  new Date(`${label}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
