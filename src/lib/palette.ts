import { Palette } from "@/types/enums";

// localStorage key holding the user's chosen palette (per browser).
export const PALETTE_STORAGE_KEY = "snacks-palette";
// Fired on the window after a change so every mounted menu re-reads it (the native `storage` event only fires in other tabs).
export const PALETTE_CHANGE_EVENT = "snacks-palette-change";

export function isPalette(value: unknown): value is Palette {
  return typeof value === "string" && (Object.values(Palette) as string[]).includes(value);
}

// Runs in <head> before first paint, so the saved palette is applied with no flash of the default one.
// Wrapped in try/catch because localStorage can throw (private mode, blocked site data); the default then stays.
export const PALETTE_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(PALETTE_STORAGE_KEY)});if(${JSON.stringify(
  Object.values(Palette),
)}.indexOf(p)!==-1)document.documentElement.setAttribute("data-palette",p)}catch(e){}})();`;
