import { refreshResearchSources } from "@/lib/research-db";
import { errorMessage, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    return Response.json(await refreshResearchSources(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
}
