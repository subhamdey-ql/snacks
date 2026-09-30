import { PaletteInitScript } from "@/components/common/palette-init-script";
import { FoodBackdrop } from "@/components/common/food-backdrop";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/app-providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: `${BRAND_NAME} ${BRAND_TAGLINE}`,
};

// viewport-fit=cover lets the page draw under notches/home bars; the shell pads itself with env(safe-area-inset-*).
// resizes-visual (the modern default, stated explicitly): the on-screen keyboard overlays the page instead of
// shrinking the layout, so the fixed bottom tab bar stays behind the keyboard rather than riding up over the field.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-visual",
};

// suppressHydrationWarning: next-themes sets the theme class on <html> before React hydrates.
// Page background/text colours come from globals.css so they follow the theme.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <PaletteInitScript />
      </head>
      <body className={cn(inter.className, "min-h-full flex flex-col")}>
        <FoodBackdrop />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
