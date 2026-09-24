import { createBrief, listBriefs, storageMode } from "@/lib/research-db";
import { errorMessage, jsonError, objectValue, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const briefs = await listBriefs();
    return Response.json({ briefs, count: briefs.length, storage: storageMode() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
}

export async function POST(request: Request) {
  try {
    const payload = objectValue(await readJson(request));
    const sourceIds = Array.isArray(payload.sourceIds) ? payload.sourceIds.filter((value): value is string => typeof value === "string") : [];
    const brief = await createBrief({ sourceIds, question: typeof payload.question === "string" ? payload.question : undefined, title: typeof payload.title === "string" ? payload.title : undefined, caseId: typeof payload.caseId === "string" ? payload.caseId : null });
    return Response.json({ brief }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 400);
  }
}
