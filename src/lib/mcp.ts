import { evaluateCase, normalizeCase } from "./engine";
import { createSeal, GENESIS_SEAL } from "./seals";
import { archiveCase, createCase, getCase, listCases, updateCase, verifyChain } from "./db";
import { objectValue } from "./http";
import type { CaseDraft, McpTool } from "./types";

const tools: McpTool[] = [
  {
    name: "list_cases",
    description: "List stewardship cases, optionally filtered by a text query or status.",
    inputSchema: { type: "object", properties: { query: { type: "string" }, status: { type: "string" } } },
  },
  {
    name: "get_case",
    description: "Read one case with its score, factors, revision history, and seal.",
    inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
  },
  {
    name: "create_case",
    description: "Create a persisted stewardship case and return its first sealed revision.",
    inputSchema: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string" },
        system: { type: "string" },
        context: { type: "string" },
        autonomy: { type: "number", minimum: 0, maximum: 100 },
        reversibility: { type: "number", minimum: 0, maximum: 100 },
        oversight: { type: "number", minimum: 0, maximum: 100 },
        affected: { type: "number", minimum: 0, maximum: 100 },
        voice: { type: "number", minimum: 0, maximum: 100 },
        safeguards: { type: "string" },
        owner: { type: "string" },
      },
    },
  },
  {
    name: "update_case",
    description: "Patch a persisted case, recompute its score, and append a new SHA-384 seal.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        system: { type: "string" },
        context: { type: "string" },
        autonomy: { type: "number", minimum: 0, maximum: 100 },
        reversibility: { type: "number", minimum: 0, maximum: 100 },
        oversight: { type: "number", minimum: 0, maximum: 100 },
        affected: { type: "number", minimum: 0, maximum: 100 },
        voice: { type: "number", minimum: 0, maximum: 100 },
        safeguards: { type: "string" },
        owner: { type: "string" },
        status: { type: "string" },
      },
    },
  },
  {
    name: "score_case",
    description: "Score a scenario without persisting it and return explainable factors plus a preview seal.",
    inputSchema: { type: "object", properties: { case: { type: "object" }, previousSeal: { type: "string" } } },
  },
  {
    name: "verify_chain",
    description: "Replay the full case history and verify every SHA-384 link.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "retire_case",
    description: "Retire a case while preserving its revision and seal history.",
    inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
  },
];

function toolResult(value: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
    isError: false,
  };
}

export async function handleMcpRequest(payload: unknown): Promise<Record<string, unknown>> {
  const request = objectValue(payload);
  const id = request.id ?? null;
  const method = typeof request.method === "string" ? request.method : "";
  const params = objectValue(request.params);

  if (method === "initialize") {
    return { jsonrpc: "2.0", id, result: { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "stewardship-ledger", version: "1.0.0" } } };
  }
  if (method === "notifications/initialized" || method === "notifications/cancelled") {
    return { jsonrpc: "2.0", id, result: {} };
  }
  if (method === "ping") {
    return { jsonrpc: "2.0", id, result: {} };
  }
  if (method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools } };
  }
  if (method !== "tools/call") {
    return { jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown method: ${method}` } };
  }

  const name = typeof params.name === "string" ? params.name : "";
  const args = objectValue(params.arguments);
  try {
    if (name === "list_cases") {
      return { jsonrpc: "2.0", id, result: toolResult(await listCases({ query: typeof args.query === "string" ? args.query : undefined, status: typeof args.status === "string" ? args.status : undefined })) };
    }
    if (name === "get_case") {
      const record = await getCase(String(args.id ?? ""));
      if (!record) {
        return { jsonrpc: "2.0", id, error: { code: -404, message: "Case not found." } };
      }
      return { jsonrpc: "2.0", id, result: toolResult(record) };
    }
    if (name === "create_case") {
      return { jsonrpc: "2.0", id, result: toolResult(await createCase(args as CaseDraft, "mcp-agent")) };
    }
    if (name === "update_case") {
      const record = await updateCase(String(args.id ?? ""), args, "mcp-agent");
      if (!record) {
        return { jsonrpc: "2.0", id, error: { code: -404, message: "Case not found." } };
      }
      return { jsonrpc: "2.0", id, result: toolResult(record) };
    }
    if (name === "score_case") {
      const candidate = normalizeCase(objectValue(args.case));
      const score = evaluateCase(candidate);
      const seal = createSeal(candidate, score, typeof args.previousSeal === "string" ? args.previousSeal : GENESIS_SEAL);
      return { jsonrpc: "2.0", id, result: toolResult({ case: candidate, score, seal }) };
    }
    if (name === "verify_chain") {
      return { jsonrpc: "2.0", id, result: toolResult(await verifyChain()) };
    }
    if (name === "retire_case") {
      const record = await archiveCase(String(args.id ?? ""), "mcp-agent");
      if (!record) {
        return { jsonrpc: "2.0", id, error: { code: -404, message: "Case not found." } };
      }
      return { jsonrpc: "2.0", id, result: toolResult(record) };
    }
    return { jsonrpc: "2.0", id, error: { code: -32602, message: `Unknown tool: ${name}` } };
  } catch (error) {
    return { jsonrpc: "2.0", id, error: { code: -32000, message: error instanceof Error ? error.message : "Tool failed." } };
  }
}
