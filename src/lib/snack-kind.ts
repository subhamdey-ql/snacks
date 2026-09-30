import { SnackKind } from "@/types/enums";

// First matching rule wins, so the specific foods come before the catch-all bakery words.
const RULES: readonly (readonly [SnackKind, RegExp])[] = [
  [SnackKind.COFFEE, /\b(coffee|chai|tea|latte|cappuccino|espresso)\b/],
  [SnackKind.ICE_CREAM, /\b(ice ?cream|kulfi|gelato|popsicle)\b/],
  [SnackKind.PIZZA, /\bpizza\b/],
  [SnackKind.SANDWICH, /\b(sandwich|burger|wrap|roll|toast|sub)\b/],
  [SnackKind.POPCORN, /\b(popcorn|chips|lays|kurkure|nachos|namkeen|bhujia|makhana|crisps)\b/],
  [SnackKind.FRUIT, /\b(apple|banana|fruit|orange|mango|grapes?|salad|berry|berries)\b/],
  [SnackKind.DRINK, /\b(cola|coke|pepsi|soda|juice|shake|lassi|water|drink|sprite)\b/],
  [SnackKind.SWEET, /\b(chocolate|candy|sweet|toffee|gulab|laddu|ladoo|jalebi|barfi|halwa)\b/],
  [SnackKind.BAKERY, /\b(biscuit|cookie|cake|pastry|croissant|muffin|bun|bread|rusk|samosa|puff)\b/],
];

// Case-insensitive guess; anything unrecognised is a plain cookie.
export function snackKind(name: string): SnackKind {
  const text = name.toLowerCase();
  for (const [kind, pattern] of RULES) if (pattern.test(text)) return kind;
  return SnackKind.COOKIE;
}
