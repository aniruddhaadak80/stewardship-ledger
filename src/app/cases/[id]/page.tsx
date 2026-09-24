import { CaseDetailClient } from "@/components/CaseDetailClient";

export const metadata = {
  title: "Case detail",
  description: "Inspect a stewardship case, its factors, and its replayable seal chain.",
};

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CaseDetailClient id={id} />;
}
