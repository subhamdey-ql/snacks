"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

// Toasts read the theme tokens, so they follow light/dark without knowing the current theme.
const TOAST_STYLE: React.CSSProperties = {
  background: "var(--gos-surface)",
  color: "var(--gos-text)",
  border: "1px solid var(--gos-border)",
  borderRadius: "0.75rem",
  boxShadow: "var(--gos-shadow)",
};

export function AppProviders({ children }: { children: React.ReactNode }): React.JSX.Element {
  // One client per browser session; useState keeps it stable across renders.
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: false } } }));
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        <NuqsAdapter>{children}</NuqsAdapter>
        {/* Lifted above the fixed mobile bottom nav (<md); normal offset on desktop. */}
        <Toaster position="bottom-center" containerClassName="bottom-[calc(6rem+env(safe-area-inset-bottom))]! md:bottom-4!" toastOptions={{ duration: 3000, style: TOAST_STYLE }} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
