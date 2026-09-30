import { cn } from "@/lib/utils";

// Caps height and scrolls internally so a long list never turns into a full-page scroll.
export function ScrollableList({ className, children }: { className?: string; children: React.ReactNode }): React.JSX.Element {
  return <div className={cn("max-h-[calc(100vh-320px)] overflow-y-auto", className)}>{children}</div>;
}
