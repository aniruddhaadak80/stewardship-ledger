import { notFound } from "next/navigation";
import { BriefDetailClient } from "@/components/BriefDetailClient";
import { getBrief } from "@/lib/research-db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Brief detail",
  description: "Inspect and revise a sealed plain-language alignment evidence brief.",
};

export default async function BriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brief = await getBrief(id);
  if (!brief) notFound();
  return <BriefDetailClient initialBrief={brief} />;
}
