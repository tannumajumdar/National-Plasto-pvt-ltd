import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/hooks/use-theme";
import { SITE } from "@/lib/constants";
import { INTRO_INIT_SCRIPT } from "@/lib/intro";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.shortName}`,
  },
  description: SITE.description,
  keywords: [
    "National Plasto",
    "plastic furniture Kolkata",
    "plastic chairs",
    "plastic tables",
    "shoe rack",
    "NEXT collection",
    "NATIONAL collection",
    "NATIONAL SAPPHIRE",
    "plastic products manufacturer India",
  ],
  authors: [{ name: SITE.legalName }],
  creator: SITE.legalName,
  publisher: SITE.legalName,
  formatDetection: { telephone: true, address: true, email: true },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE.legalName} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  // A single unconditional tag, not a prefers-color-scheme pair: the site
  // defaults to dark regardless of the OS setting, and applyTheme() rewrites
  // this same tag when a visitor picks light.
  themeColor: "#0a1420",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        {/*
          Applies the stored theme before the first paint. It must be inline
          and blocking — running this after hydration would show every
          dark-mode visitor a white flash first. `suppressHydrationWarning`
          above is here because of it: the server cannot know which class
          this will add.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/*
          Decides whether the intro plays and paints its backdrop with the
          first frame. It has to be inline and blocking for the same reason
          the theme script does: <CompanyIntro> is a client component, so
          anything it paints arrives after hydration — which is why the intro
          used to appear on top of an already-visible homepage.
        */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${jakarta.variable} antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
