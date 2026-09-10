import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";

import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { site } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  // No global title template: several page titles are already 45-53 characters
  // and a "| brand" suffix would push them past the ~60-char SERP truncation.
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author.name, url: `https://github.com/${site.author.github}` }],
  creator: site.author.name,
  keywords: [
    "react tree view with checkboxes",
    "react virtualized tree",
    "react checkbox tree",
    "headless react tree component",
    "react tri-state checkbox tree",
    "react tree 100000 nodes",
    "react-checkbox-tree alternative",
    "react arborist checkbox",
    "shadcn tree view",
    "indeterminate checkbox react",
  ],
  alternates: { canonical: "/" },
  // Deliberately no title/description/url here. Metadata merges shallowly, so
  // declaring them at the root made all 38 pages advertise themselves as the
  // homepage when shared. Left unset, Next falls these back to each page own
  // title and description — only the genuinely global fields belong at the root.
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  // Set in Vercel -> Settings -> Environment Variables once each property is
  // created. Kept out of the source so verifying a new search engine is a
  // dashboard change rather than a deploy.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : {},
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

// Runs before paint. A white flash on a page whose entire claim is "this is
// fast and carefully made" is disqualifying.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('rvct-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link href="/llms.txt" rel="alternate" title="llms.txt" type="text/plain" />
      </head>
      <body className="min-h-screen antialiased">
        <a
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--color-accent)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--color-accent-fg)]"
          href="#main"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        {/* Cookieless and first-party, so no consent banner and nothing to disclose
            beyond this. Vercel Analytics gives referrers, which is the only way
            to tell which launch channel actually sent people. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
