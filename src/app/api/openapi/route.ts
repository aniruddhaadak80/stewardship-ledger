const openApi = {
  openapi: "3.1.0",
  info: {
    title: "Stewardship Ledger API",
    version: "1.0.0",
    description: "CRUD, explainable scoring, public safety signals, and replayable stewardship evidence.",
  },
  servers: [{ url: "https://stewardship-ledger.vercel.app" }],
  paths: {
    "/api/health": { get: { summary: "Check service and storage health", responses: { "200": { description: "Healthy" }, "503": { description: "Storage unavailable" } } } },
    "/api/cases": {
      get: { summary: "List stewardship cases", parameters: [{ name: "q", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Case list" } } },
      post: { summary: "Create a sealed case", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CaseDraft" } } } }, responses: { "201": { description: "Created case" } } },
    },
    "/api/cases/{id}": {
      get: { summary: "Read one case", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Case" }, "404": { description: "Not found" } } },
      patch: { summary: "Update and reseal a case", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated case" } } },
      delete: { summary: "Retire a case while preserving history", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Retired case" } } },
    },
    "/api/score": { post: { summary: "Preview an explainable score and seal", responses: { "200": { description: "Score result" } } } },
    "/api/feed": { get: { summary: "Read normalized public safety signals", responses: { "200": { description: "Feed" } } } },
    "/api/verify": { get: { summary: "Replay the full seal chain", responses: { "200": { description: "Chain result" } } } },
    "/mcp": { post: { summary: "JSON-RPC MCP endpoint", responses: { "200": { description: "MCP response" } } } },
  },
  components: {
    schemas: {
      CaseDraft: {
        type: "object",
        required: ["title", "system", "context", "safeguards", "owner"],
        properties: {
          title: { type: "string" },
          system: { type: "string" },
          context: { type: "string" },
          autonomy: { type: "integer", minimum: 0, maximum: 100 },
          reversibility: { type: "integer", minimum: 0, maximum: 100 },
          oversight: { type: "integer", minimum: 0, maximum: 100 },
          affected: { type: "integer", minimum: 0, maximum: 100 },
          voice: { type: "integer", minimum: 0, maximum: 100 },
          safeguards: { type: "string" },
          owner: { type: "string" },
          status: { type: "string", enum: ["draft", "active", "review", "retired"] },
        },
      },
    },
  },
} as const;

export async function GET() {
  return Response.json(openApi, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
