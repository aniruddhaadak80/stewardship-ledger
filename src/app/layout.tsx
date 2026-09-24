import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";
import "./atlas.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stewardship-ledger.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Stewardship Ledger — Read the evidence. Then act.",
    template: "%s · Stewardship Ledger",
  },
  description: "An evidence-first atlas and casebook for reading AI safety research, care, control, and accountable systems.",
  keywords: ["AI safety", "alignment research", "AI governance", "evidence atlas", "care ethics", "MCP", "agent oversight", "frontier AI"],
  authors: [{ name: "Stewardship Ledger" }],
  creator: "Stewardship Ledger",
  openGraph: {
    type: "website",
    title: "Stewardship Ledger — Read the evidence. Then act.",
    description: "Read alignment research, model the risk, name the safeguards, and leave a verifiable trail.",
    siteName: "Stewardship Ledger",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Stewardship Ledger — Read the evidence. Then act.",
    description: "Read alignment research, model the risk, name the safeguards, and leave a verifiable trail.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
