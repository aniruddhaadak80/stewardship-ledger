import { handleMcpRequest } from "@/lib/mcp";
import { errorMessage, jsonError, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return Response.json(await handleMcpRequest(await readJson(request)), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 400);
  }
}

export async function GET() {
  return Response.json({ transport: "json-rpc", endpoint: "/mcp", status: "ready" });
}
