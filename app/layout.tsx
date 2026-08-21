import type { Metadata } from "next";
import { Archivo, Public_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSiteContent } from "@/lib/content";
import { themeScript } from "@/components/theme-toggle";
import { InlineScript } from "@/components/inline-script";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "https://agfasgas.com"),
  title: {
    default: "AGFAS — Gas leak detectors and fire safety equipment",
    template: "%s · AGFAS",
  },
  description:
    "AGFAS supplies gas leak detectors, alarms and fire safety equipment for Malaysian homes, kitchens and worksites.",
  openGraph: {
    type: "website",
    siteName: "AGFAS",
    locale: "en_MY",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const t = await getSiteContent();

  // Section labels, not category names — so the nav still reads true if the
  // catalogue grows beyond detectors.
  const nav = [
    { href: "/products", label: t.nav_products },
    { href: "/about", label: t.nav_about },
    { href: "/blog", label: t.nav_blog },
    { href: "/contact", label: t.nav_contact },
  ];

  return (
    <html
      lang="en-MY"
      data-theme="light"
      suppressHydrationWarning
      className={`${archivo.variable} ${publicSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <InlineScript html={themeScript} />
      </head>
      <body className="flex min-h-full flex-col bg-paper">
        <CartProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-solid focus:px-4 focus:py-2 focus:text-sm focus:text-on-solid"
          >
            Skip to content
          </a>
          <SiteHeader nav={nav} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
