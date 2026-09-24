import { archiveBrief, getBrief, updateBrief } from "@/lib/research-db";
import { errorMessage, jsonError, objectValue, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const brief = await getBrief(id);
    if (!brief) return jsonError("Brief not found.", 404);
    return Response.json({ brief }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const payload = objectValue(await readJson(request));
    const brief = await updateBrief(id, { sourceIds: Array.isArray(payload.sourceIds) ? payload.sourceIds.filter((value): value is string => typeof value === "string") : undefined, question: typeof payload.question === "string" ? payload.question : undefined, title: typeof payload.title === "string" ? payload.title : undefined });
    if (!brief) return jsonError("Brief not found.", 404);
    return Response.json({ brief }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 400);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const brief = await archiveBrief(id);
    if (!brief) return jsonError("Brief not found.", 404);
    return Response.json({ brief, retired: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
}
