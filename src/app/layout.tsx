import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stewardship-ledger.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Stewardship Ledger — Make AI power answerable",
    template: "%s · Stewardship Ledger",
  },
  description: "An evidence-first casebook for care, control, and accountable AI systems.",
  keywords: ["AI safety", "alignment", "AI governance", "care ethics", "MCP", "agent oversight", "frontier AI"],
  authors: [{ name: "Stewardship Ledger" }],
  creator: "Stewardship Ledger",
  openGraph: {
    type: "website",
    title: "Stewardship Ledger — Make AI power answerable",
    description: "Model the risk, name the safeguards, and leave a verifiable trail.",
    siteName: "Stewardship Ledger",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Stewardship Ledger — Make AI power answerable",
    description: "Model the risk, name the safeguards, and leave a verifiable trail.",
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
