"use client";

import { PALETTE_INIT_SCRIPT } from "@/lib/palette";

// Applies the saved colour palette before first paint (no flash); see src/lib/palette.ts.
// Rendered on the server only: the script has already run by the time React hydrates, and React 19 logs
// "Encountered a script tag while rendering React component" whenever the client itself creates a <script>
// (e.g. a dev refresh or a hydration retry). Returning null on the client avoids that without changing the HTML.
export function PaletteInitScript() {
  if (typeof window !== "undefined") return null;
  return <script dangerouslySetInnerHTML={{ __html: PALETTE_INIT_SCRIPT }} />;
}
