import { useCallback, useSyncExternalStore } from "react";
import { isPalette, PALETTE_CHANGE_EVENT, PALETTE_STORAGE_KEY } from "@/lib/palette";
import { Palette } from "@/types/enums";

function subscribe(onChange: () => void): () => void {
  window.addEventListener(PALETTE_CHANGE_EVENT, onChange);
  // A change made in another tab: apply it here too.
  const onStorage = (e: StorageEvent): void => {
    if (e.key !== PALETTE_STORAGE_KEY) return;
    if (isPalette(e.newValue)) document.documentElement.setAttribute("data-palette", e.newValue);
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(PALETTE_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

// The palette currently applied to <html> (set before paint by the inline init script).
function readPalette(): Palette {
  const value = document.documentElement.getAttribute("data-palette");
  return isPalette(value) ? value : Palette.FOOD;
}

// Current palette + a setter that applies it immediately and remembers it in this browser.
export function usePalette(): { readonly palette: Palette; readonly setPalette: (next: Palette) => void } {
  const palette = useSyncExternalStore(subscribe, readPalette, () => Palette.FOOD);
  const setPalette = useCallback((next: Palette): void => {
    document.documentElement.setAttribute("data-palette", next);
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice still applies for this visit, it just won't be remembered.
    }
    window.dispatchEvent(new Event(PALETTE_CHANGE_EVENT));
  }, []);
  return { palette, setPalette };
}
