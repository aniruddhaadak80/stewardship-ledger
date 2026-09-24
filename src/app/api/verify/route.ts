import { getCase, verifyChain } from "@/lib/db";
import { verifySeal } from "@/lib/seals";
import { errorMessage, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    const chain = await verifyChain();
    if (!id) {
      return Response.json(chain, { headers: { "Cache-Control": "no-store" } });
    }
    const record = await getCase(id, true);
    if (!record) {
      return jsonError("Case not found.", 404);
    }
    return Response.json({ ...chain, caseSealValid: verifySeal(record) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
}
