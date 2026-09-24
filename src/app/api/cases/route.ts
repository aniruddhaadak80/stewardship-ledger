import { createCase, listCases } from "@/lib/db";
import { errorMessage, jsonError, readJson } from "@/lib/http";
import { validateDraft } from "@/lib/engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const cases = await listCases({
      query: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      includeDeleted: url.searchParams.get("includeDeleted") === "true",
    });
    return Response.json({ cases, count: cases.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
}

export async function POST(request: Request) {
  try {
    const draft = validateDraft(await readJson(request));
    const record = await createCase({ ...draft, status: draft.status ?? "active" }, "public steward");
    return Response.json({ case: record }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 400);
  }
}
