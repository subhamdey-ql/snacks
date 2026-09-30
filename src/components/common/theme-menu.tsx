"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Palette as PaletteIcon, Sun, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
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
  readonly side?: ComponentProps<typeof PopoverContent>["side"];
  readonly align?: ComponentProps<typeof PopoverContent>["align"];
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
              <Button
                key={p.value}
                type="button"
                variant="ghost"
                role="radio"
                aria-checked={active}
                onClick={() => setPalette(p.value)}
                className={cn(
                  "flex h-auto min-h-11 w-full items-center justify-start gap-3 rounded-xl border-0 px-2.5 text-left font-[weight:inherit] text-[length:inherit] leading-[inherit] whitespace-normal transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-0",
                  active
                    ? "bg-[var(--gos-primary-light)] hover:bg-[var(--gos-primary-light)] dark:hover:bg-[var(--gos-primary-light)]"
                    : "hover:bg-[var(--gos-surface-muted)] dark:hover:bg-[var(--gos-surface-muted)]",
                )}
              >
                <span aria-hidden className={cn("size-6 shrink-0 rounded-full ring-2 ring-[var(--gos-surface)] ring-offset-1 ring-offset-[var(--gos-border)]", p.swatch)} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--gos-text)]">{p.label}</span>
                  <span className="block text-xs text-[var(--gos-text-muted)]">{p.hint}</span>
                </span>
                {active && <Check className="size-4 shrink-0 text-[var(--gos-primary-text)]" aria-hidden />}
              </Button>
            );
          })}
        </div>
        <div role="radiogroup" aria-label="Light or dark" className="flex flex-col gap-1">
          <p className="px-1 pb-1 text-xs font-semibold tracking-wide text-[var(--gos-text-muted)] uppercase">Appearance</p>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--gos-surface-muted)] p-1">
            {MODES.map((m) => {
              const active = mounted && theme === m.value;
              return (
                <Button
                  key={m.value}
                  type="button"
                  variant="ghost"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(m.value)}
                  className={cn(
                    "flex h-auto min-h-10 items-center justify-center gap-1.5 rounded-lg border-0 px-0 text-sm font-medium whitespace-normal transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-0",
                    active
                      ? "bg-[var(--gos-surface)] text-[var(--gos-text)] shadow-[var(--gos-shadow)] hover:bg-[var(--gos-surface)] hover:text-[var(--gos-text)] dark:hover:bg-[var(--gos-surface)]"
                      : "text-[var(--gos-text-muted)] hover:bg-transparent hover:text-[var(--gos-text)] dark:hover:bg-transparent",
                  )}
                >
                  <m.icon className="size-4" aria-hidden />
                  {m.label}
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
