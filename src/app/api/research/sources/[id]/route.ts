import { getResearchSource, listCommentary } from "@/lib/research-db";
import { errorMessage, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const source = await getResearchSource(id);
    if (!source) return jsonError("Source not found.", 404);
    const commentary = await listCommentary(id);
    return Response.json({ source, commentary }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
}
