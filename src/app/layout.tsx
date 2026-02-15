import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL;
const metadataBase = siteUrl ? new URL(siteUrl) : undefined;

const headingFont = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase,
  applicationName: "What's My IP?",
  title: "What's My IP? | Instant IP, Network & Browser Diagnostics",
  description:
    "Check your public IP address instantly with privacy-first network, browser, and security diagnostics. No tracking, no analytics.",
  keywords: [
    "what is my ip",
    "my ip address",
    "ip checker",
    "ipv4",
    "ipv6",
    "network diagnostics",
    "browser diagnostics",
    "privacy ip tool",
  ],
  authors: [{ name: "Isaac D'Césares", url: "https://dcesares.dev" }],
  creator: "Isaac D'Césares",
  publisher: "Isaac D'Césares",
  category: "technology",
  alternates: {
    canonical: "/",
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
  openGraph: {
    title: "What's My IP? | Privacy-First IP & Network Diagnostics",
    description:
      "Instantly discover your public IP address, network quality, browser capability, and security header posture.",
    url: siteUrl ?? undefined,
    siteName: "What's My IP?",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "What's My IP? by Isaac D'Césares",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "What's My IP? | Privacy-First IP Diagnostics",
    description: "Find your IP and inspect network, browser, and privacy/security metrics in real time.",
    images: ["/twitter-image"],
    creator: "@idcesares",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "What's My IP?",
    url: siteUrl ?? "https://example.com",
    inLanguage: "en-US",
    creator: {
      "@type": "Person",
      name: "Isaac D'Césares",
      url: "https://dcesares.dev",
    },
    publisher: {
      "@type": "Person",
      name: "Isaac D'Césares",
      url: "https://dcesares.dev",
    },
    about: "IP address checker and privacy-first network diagnostics web app",
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${headingFont.variable} ${bodyFont.variable} ${monoFont.variable} antialiased`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics/>
      </body>
    </html>
  );
}
