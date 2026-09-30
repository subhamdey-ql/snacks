"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Palette as PaletteIcon, Sun, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePalette } from "@/hooks/usePalette";
import { cn } from "@/lib/utils";
import { Palette } from "@/types/enums";

const noopSubscribe = (): (() => void) => () => {};

const PALETTES: readonly { readonly value: Palette; readonly label: string; readonly hint: string; readonly swatch: string }[] = [
  { value: Palette.FOOD, label: "Food", hint: "Warm orange and cream", swatch: "bg-[var(--gos-swatch-food)]" },
  { value: Palette.BLUE, label: "Blue", hint: "Cool brand blue", swatch: "bg-[var(--gos-swatch-blue)]" },
  { value: Palette.PLAIN, label: "Plain", hint: "Neutral white and grey", swatch: "bg-[var(--gos-swatch-plain)]" },
];

// next-themes stores "light" | "dark" | "system".
const MODES: readonly { readonly value: string; readonly label: string; readonly icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
];

interface ThemeMenuProps {
  // Where the panel opens: the sidebar's footer opens upwards, the phone header downwards.
  readonly side?: "top" | "bottom";
  readonly align?: "start" | "end";
}

// Theme picker: choose a colour palette and a light/dark mode. Both are remembered in this browser.
export function ThemeMenu({ side = "bottom", align = "end" }: ThemeMenuProps): React.JSX.Element {
  const { palette, setPalette } = usePalette();
  const { theme, setTheme } = useTheme();
  // The saved mode is unknown during SSR; show nothing as selected until mounted to avoid a hydration mismatch.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Choose theme"
            className="size-11 rounded-xl text-[var(--gos-text-muted)] hover:text-[var(--gos-text)] md-fine:size-10"
          />
        }
      >
        <PaletteIcon className="size-5" />
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-72 gap-3 rounded-2xl border border-[var(--gos-border)] bg-[var(--gos-surface)] p-3 shadow-[var(--gos-shadow-lg)]">
        <div role="radiogroup" aria-label="Colour theme" className="flex flex-col gap-1">
          <p className="px-1 pb-1 text-xs font-semibold tracking-wide text-[var(--gos-text-muted)] uppercase">Colour theme</p>
          {PALETTES.map((p) => {
            const active = palette === p.value;
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPalette(p.value)}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 rounded-xl px-2.5 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                  active ? "bg-[var(--gos-primary-light)]" : "hover:bg-[var(--gos-surface-muted)]",
                )}
              >
                <span aria-hidden className={cn("size-6 shrink-0 rounded-full ring-2 ring-[var(--gos-surface)] ring-offset-1 ring-offset-[var(--gos-border)]", p.swatch)} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--gos-text)]">{p.label}</span>
                  <span className="block text-xs text-[var(--gos-text-muted)]">{p.hint}</span>
                </span>
                {active && <Check className="size-4 shrink-0 text-[var(--gos-primary-text)]" aria-hidden />}
              </button>
            );
          })}
        </div>
        <div role="radiogroup" aria-label="Light or dark" className="flex flex-col gap-1">
          <p className="px-1 pb-1 text-xs font-semibold tracking-wide text-[var(--gos-text-muted)] uppercase">Appearance</p>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--gos-surface-muted)] p-1">
            {MODES.map((m) => {
              const active = mounted && theme === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(m.value)}
                  className={cn(
                    "flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                    active ? "bg-[var(--gos-surface)] text-[var(--gos-text)] shadow-[var(--gos-shadow)]" : "text-[var(--gos-text-muted)] hover:text-[var(--gos-text)]",
                  )}
                >
                  <m.icon className="size-4" aria-hidden />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
