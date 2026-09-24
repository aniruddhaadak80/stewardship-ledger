import { evaluateCase, normalizeCase } from "@/lib/engine";
import { createSeal, GENESIS_SEAL } from "@/lib/seals";
import { errorMessage, jsonError, objectValue, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = objectValue(await readJson(request));
    const candidate = normalizeCase(objectValue(payload.case ?? payload));
    const score = evaluateCase(candidate);
    const previousSeal = typeof payload.previousSeal === "string" ? payload.previousSeal : GENESIS_SEAL;
    const seal = createSeal(candidate, score, previousSeal);
    return Response.json({ case: candidate, score, seal }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 400);
  }
}
