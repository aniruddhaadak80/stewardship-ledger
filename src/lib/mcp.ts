import { evaluateCase, normalizeCase } from "./engine";
import { createSeal, GENESIS_SEAL } from "./seals";
import { archiveCase, createCase, getCase, listCases, updateCase, verifyChain } from "./db";
import { archiveBrief, createBrief, getBrief, getResearchSource, listBriefs, listCommentary, listResearchSources, previewBrief, refreshResearchSources, updateBrief } from "./research-db";
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
  {
    name: "list_sources",
    description: "List alignment evidence sources with kind, topic, query, evidence grade, and provenance filters.",
    inputSchema: { type: "object", properties: { query: { type: "string" }, kind: { type: "string" }, topic: { type: "string" } } },
  },
  {
    name: "get_source",
    description: "Read one alignment evidence source, including its claim, limitations, topics, and source fingerprint.",
    inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
  },
  {
    name: "list_commentary",
    description: "List attributed commentary lenses, optionally attached to one source.",
    inputSchema: { type: "object", properties: { sourceId: { type: "string" } } },
  },
  {
    name: "refresh_sources",
    description: "Refresh public arXiv, OpenAlex, and podcast providers and persist the sealed source records.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "preview_brief",
    description: "Synthesize a plain-language evidence brief without persisting it.",
    inputSchema: { type: "object", properties: { sourceIds: { type: "array", items: { type: "string" } }, question: { type: "string" }, title: { type: "string" } } },
  },
  {
    name: "save_brief",
    description: "Synthesize and persist a sealed evidence brief with source provenance and a SHA-384 seal.",
    inputSchema: { type: "object", properties: { sourceIds: { type: "array", items: { type: "string" } }, question: { type: "string" }, title: { type: "string" }, caseId: { type: "string", nullable: true } } },
  },
  {
    name: "list_briefs",
    description: "List saved evidence briefs, newest first.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_brief",
    description: "Read one saved brief with its synthesis, source IDs, action steps, and seal.",
    inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
  },
  {
    name: "update_brief",
    description: "Revise a saved brief question or title and append a new SHA-384 seal.",
    inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" }, sourceIds: { type: "array", items: { type: "string" } }, question: { type: "string" }, title: { type: "string" } } },
  },
  {
    name: "archive_brief",
    description: "Archive a saved brief while preserving its record and seal trail.",
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
    return { jsonrpc: "2.0", id, result: { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "stewardship-ledger", version: "1.1.0" } } };
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
  const sourceIds = Array.isArray(args.sourceIds) ? args.sourceIds.filter((value): value is string => typeof value === "string") : undefined;
  const stringValue = (value: unknown) => typeof value === "string" ? value : undefined;
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
    if (name === "list_sources") {
      return { jsonrpc: "2.0", id, result: toolResult(await listResearchSources({ query: stringValue(args.query), kind: stringValue(args.kind), topic: stringValue(args.topic) })) };
    }
    if (name === "get_source") {
      const source = await getResearchSource(String(args.id ?? ""));
      if (!source) {
        return { jsonrpc: "2.0", id, error: { code: -404, message: "Research source not found." } };
      }
      return { jsonrpc: "2.0", id, result: toolResult(source) };
    }
    if (name === "list_commentary") {
      return { jsonrpc: "2.0", id, result: toolResult(await listCommentary(stringValue(args.sourceId))) };
    }
    if (name === "refresh_sources") {
      return { jsonrpc: "2.0", id, result: toolResult(await refreshResearchSources()) };
    }
    if (name === "preview_brief") {
      return { jsonrpc: "2.0", id, result: toolResult(await previewBrief(sourceIds ?? [], stringValue(args.question), stringValue(args.title))) };
    }
    if (name === "save_brief") {
      return { jsonrpc: "2.0", id, result: toolResult(await createBrief({ sourceIds: sourceIds ?? [], question: stringValue(args.question), title: stringValue(args.title), caseId: stringValue(args.caseId) ?? null })) };
    }
    if (name === "list_briefs") {
      return { jsonrpc: "2.0", id, result: toolResult(await listBriefs()) };
    }
    if (name === "get_brief") {
      const brief = await getBrief(String(args.id ?? ""));
      if (!brief) {
        return { jsonrpc: "2.0", id, error: { code: -404, message: "Saved brief not found." } };
      }
      return { jsonrpc: "2.0", id, result: toolResult(brief) };
    }
    if (name === "update_brief") {
      const brief = await updateBrief(String(args.id ?? ""), { sourceIds, question: stringValue(args.question), title: stringValue(args.title) });
      if (!brief) {
        return { jsonrpc: "2.0", id, error: { code: -404, message: "Saved brief not found." } };
      }
      return { jsonrpc: "2.0", id, result: toolResult(brief) };
    }
    if (name === "archive_brief") {
      const brief = await archiveBrief(String(args.id ?? ""));
      if (!brief) {
        return { jsonrpc: "2.0", id, error: { code: -404, message: "Saved brief not found." } };
      }
      return { jsonrpc: "2.0", id, result: toolResult(brief) };
    }
    return { jsonrpc: "2.0", id, error: { code: -32602, message: `Unknown tool: ${name}` } };
  } catch (error) {
    return { jsonrpc: "2.0", id, error: { code: -32000, message: error instanceof Error ? error.message : "Tool failed." } };
  }
}
