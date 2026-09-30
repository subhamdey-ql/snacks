// Employee category; decides which monthly allowance applies.
export enum EmployeeType {
  WFO = "WFO",
  HYBRID = "HYBRID",
}

// Brand accent colour for decorative fills (avatars, stat-card icons). Mapped to token classes in accent-classes.ts.
export enum AccentTone {
  // Chilli-tomato, the app's primary action colour.
  PRIMARY = "primary",
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

// What kind of food a snack is, guessed from its name; decides its icon and tile colour.
export enum SnackKind {
  COOKIE = "cookie",
  COFFEE = "coffee",
  POPCORN = "popcorn",
  PIZZA = "pizza",
  SANDWICH = "sandwich",
  FRUIT = "fruit",
  ICE_CREAM = "ice_cream",
  DRINK = "drink",
  SWEET = "sweet",
  BAKERY = "bakery",
}

// Colour palette the user picks in the theme menu (stored in their browser). Light/dark is a separate switch.
export enum Palette {
  FOOD = "food",
  BLUE = "blue",
  PLAIN = "plain",
}
