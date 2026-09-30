import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/app-providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Snacks Tracker",
  description: "Snacks credit tracker",
};

// suppressHydrationWarning: next-themes sets the theme class on <html> before React hydrates.
// Page background/text colours come from globals.css so they follow the theme.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className={cn(inter.className, "min-h-full flex flex-col")}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
