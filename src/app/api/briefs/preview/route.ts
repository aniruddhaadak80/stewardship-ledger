import { previewBrief } from "@/lib/research-db";
import { errorMessage, jsonError, objectValue, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = objectValue(await readJson(request));
    const sourceIds = Array.isArray(payload.sourceIds) ? payload.sourceIds.filter((value): value is string => typeof value === "string") : [];
    const brief = await previewBrief(sourceIds, typeof payload.question === "string" ? payload.question : undefined, typeof payload.title === "string" ? payload.title : undefined);
    return Response.json({ brief }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 400);
  }
}
