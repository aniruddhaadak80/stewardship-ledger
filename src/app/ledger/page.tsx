import { LedgerClient } from "@/components/LedgerClient";

export const metadata = {
  title: "The ledger",
  description: "Create, update, retire, and replay public AI stewardship cases.",
};

export default async function LedgerPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const params = await searchParams;
  return <LedgerClient openNew={params.new === "1"} />;
}
