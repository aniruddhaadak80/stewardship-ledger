import { listCommentary, listResearchSources, refreshResearchSources, storageMode } from "@/lib/research-db";
import { errorMessage, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sourceId = url.searchParams.get("sourceId") ?? undefined;
    const [sources, commentary] = await Promise.all([listResearchSources({ query: url.searchParams.get("q") ?? undefined, kind: url.searchParams.get("kind") ?? undefined, topic: url.searchParams.get("topic") ?? undefined }), listCommentary(sourceId)]);
    return Response.json({ sources, commentary, count: sources.length, storage: storageMode() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
}

export async function POST() {
  try {
    const result = await refreshResearchSources();
    return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
}
