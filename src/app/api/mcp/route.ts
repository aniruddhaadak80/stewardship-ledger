import { handleMcpRequest } from "@/lib/mcp";
import { errorMessage, jsonError, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const result = await handleMcpRequest(await readJson(request));
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(errorMessage(error), 400);
  }
}

export async function GET() {
  return Response.json({
    transport: "json-rpc",
    endpoint: "/mcp",
    methods: ["initialize", "tools/list", "tools/call"],
    tools: ["list_cases", "get_case", "create_case", "update_case", "score_case", "verify_chain", "retire_case"],
  });
}
