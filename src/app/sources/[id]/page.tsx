import { notFound } from "next/navigation";
import { SourceDetailClient } from "@/components/SourceDetailClient";
import { getResearchSource, listCommentary } from "@/lib/research-db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Source detail",
  description: "Inspect a source claim, limitation, evidence grade, commentary, and provenance in the Alignment Evidence Atlas.",
};

export default async function SourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [source, commentary] = await Promise.all([getResearchSource(id), listCommentary(id)]);
  if (!source) notFound();
  return <SourceDetailClient source={source} commentary={commentary} />;
}
