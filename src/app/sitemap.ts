import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stewardship-ledger.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/atlas`, changeFrequency: "daily", priority: 0.95 },
    { url: `${siteUrl}/briefs`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/ledger`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/method`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/agent`, changeFrequency: "weekly", priority: 0.7 },
  ];
}
