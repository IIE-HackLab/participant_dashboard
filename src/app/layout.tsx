import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthProvider } from "@/context/AuthProvider";
import "@/globals.css";
import type { ReactNode } from "react";
import CustomCursor from "@/components/ui/CustomCursor";
import Navbar from "@/components/layout/Navbar";
import CircuitBackground from "@/components/ui/CircuitBackground";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { SITE_URL, absoluteUrl, siteConfig } from "@/lib/site";
import { validatePlatformManifest } from "@/lib/platformManifest";

// ✅ Proper font loading (Next.js optimized)
import {
  Orbitron,
  Space_Grotesk,
  JetBrains_Mono,
  Charm,
  MedievalSharp,
} from "next/font/google";

const charm = Charm({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-charm",
});

const medievalSharp = MedievalSharp({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-medieval",
});

const orbitron = Orbitron({
  // ... (keep others for fallback or specific uses)
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [
    { name: siteConfig.creator },
    { name: "Ayush Choudhary", url: "https://github.com/AR128" },
  ],
  creator: siteConfig.creator,
  publisher: siteConfig.creator,
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
  const isManifestValid = await validatePlatformManifest();

  if (!isManifestValid && process.env.NODE_ENV === "production") {
    notFound();
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: absoluteUrl("/"),
    description: siteConfig.description,
    publisher: {
      "@type": "Organization",
      name: siteConfig.creator,
      url: absoluteUrl("/"),
    },
  };

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${orbitron.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${charm.variable} ${medievalSharp.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (!window.__CODECRAFT_LOGGED__) {
                window.__CODECRAFT_LOGGED__ = true;
                const headerStyle = "background: linear-gradient(135deg, #00f2fe 0%, #4d79ff 100%); color: white; font-weight: bold; padding: 6px 12px; border-radius: 4px; font-size: 13px;";
                const itemStyle = "color: #00f2fe; font-weight: bold; padding: 4px 8px; border: 2px solid #00f2fe; border-radius: 4px; margin-top: 4px;";
                console.log("%c⚡ CODECRAFT PLATFORM INITIALIZED", headerStyle);
                console.log("%c✓ Engineered by: Ayush Choudhary", itemStyle);
                console.log("%c✓ Project Year: 2026", itemStyle);
                console.log("%c✓ Platform Status: OPERATIONAL", itemStyle);
                console.log("%c✓ GitHub: https://github.com/AR128", itemStyle);
              }
            `,
          }}
        />
        <CustomCursor />
        <AuthProvider>
          <CircuitBackground opacity={0.3} />
          <div className="scanline-overlay" aria-hidden="true" />
          <Navbar />
          <main className="flex flex-col min-h-screen">
            <div className="flex-1">{children}</div>
          </main>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
