import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brand } from "@/config/brand";

/**
 * Font note: Jost (Google Fonts) gives the ideal premium-but-approachable
 * feel for this brand. In the sandbox build it falls back to the system
 * font stack below. To enable Jost in your deployed app, uncomment the
 * next/font/google import and the jost variable className.
 *
 * import { Jost } from "next/font/google";
 * const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap", weight: ["300","400","500","600","700"] });
 * Then add: className={`${jost.className} antialiased`} to <body>
 */

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  keywords: [
    "ayurvedic soap", "natural attar", "shilajit", "herbal wellness",
    "organic skincare India", "alcohol-free perfume oil", "buy shilajit online",
    "premium Indian wellness brand",
  ],
  openGraph: {
    siteName: brand.name,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#001F4D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
