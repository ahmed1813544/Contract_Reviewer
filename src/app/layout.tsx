import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const title = "Contract.Review — Free AI Contract Analysis";
const description =
  "Analyze any PDF contract instantly. AI-powered risk scoring, clause detection, key dates, and plain-English summaries. 100% free, runs locally with Ollama. No account, no cloud, no data leaks.";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Contract.Review",
  },
  description,
  keywords: [
    "contract review",
    "AI contract analysis",
    "free contract review",
    "PDF contract analyzer",
    "legal AI tool",
    "contract risk assessment",
    "ollama contract",
    "local AI legal",
    "open source contract review",
    "contract clause detector",
  ],
  authors: [{ name: "Contract.Review" }],
  creator: "Contract.Review",
  publisher: "Contract.Review",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Contract.Review",
    title,
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Contract.Review — Free AI Contract Analysis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
    creator: "@contractreview",
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexMono.variable} ${ibmPlexSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0a0a0a] font-sans text-[#e8e6e1]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Contract.Review",
              url: siteUrl,
              description,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "AI-powered risk scoring",
                "Clause detection and analysis",
                "Key dates extraction",
                "Plain English summaries",
                "Local AI processing — no data leaks",
                "No account required",
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
