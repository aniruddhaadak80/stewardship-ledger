import { pingDatabase, storageMode } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await pingDatabase();
  return Response.json(
    {
      ok: database.ok,
      service: "stewardship-ledger",
      version: "1.1.0",
      features: ["cases", "research-atlas", "sealed-briefs", "mcp"],
      storage: storageMode(),
      database,
      timestamp: new Date().toISOString(),
    },
    { status: database.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
