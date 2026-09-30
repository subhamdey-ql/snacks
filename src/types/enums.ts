// Employee category; decides which monthly allowance applies.
export enum EmployeeType {
  WFO = "WFO",
  HYBRID = "HYBRID",
}

// Brand accent colour for decorative fills (avatars, stat-card icons). Mapped to token classes in accent-classes.ts.
export enum AccentTone {
  BLUE = "blue",
  YELLOW = "yellow",
  GREEN = "green",
  ORANGE = "orange",
  RED = "red",
}

// Colour tone of a StatusBadge (soft tinted background + matching text).
export enum BadgeTone {
  SUCCESS = "success",
  WARNING = "warning",
  INFO = "info",
  MUTED = "muted",
  DANGER = "danger",
}

// How healthy an employee's remaining monthly credits are; drives the credit meter / progress bar colour.
export enum CreditLevel {
  HEALTHY = "healthy",
  LOW = "low",
  CRITICAL = "critical",
}
