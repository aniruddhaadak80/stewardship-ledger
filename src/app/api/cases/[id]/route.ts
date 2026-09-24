import { archiveCase, getCase, updateCase } from "@/lib/db";
import { errorMessage, jsonError, objectValue, readJson } from "@/lib/http";
import { validateDraft } from "@/lib/engine";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const includeDeleted = new URL(request.url).searchParams.get("includeDeleted") === "true";
    const record = await getCase(id, includeDeleted);
    if (!record) {
      return jsonError("Case not found.", 404);
    }
    return Response.json({ case: record }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const payload = objectValue(await readJson(request));
    const record = await updateCase(id, validateDraft({ ...(await getCase(id) ?? {}), ...payload }), "public steward");
    if (!record) {
      return jsonError("Case not found.", 404);
    }
    return Response.json({ case: record }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 400);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const record = await archiveCase(id, "public steward");
    if (!record) {
      return jsonError("Case not found.", 404);
    }
    return Response.json({ case: record, retired: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
}
