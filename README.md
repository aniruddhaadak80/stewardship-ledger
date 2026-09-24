<div align="center">

# ✦ Stewardship Ledger

### Read the evidence. Then act.

A public alignment evidence atlas and stewardship casebook for care, control, and accountable AI systems.
Read primary research, frontier reports, podcasts, commentary, and tools; synthesize the next responsible move; and leave a seal another person can replay.

[![Live app](https://img.shields.io/badge/live%20app-ff6b61?style=flat-square)](https://stewardship-ledger.vercel.app)
[![MIT](https://img.shields.io/badge/license-MIT-1db7a5?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-241832?style=flat-square)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-8c7cf2?style=flat-square)](https://www.typescriptlang.org/)
[![Neon](https://img.shields.io/badge/persistence-None%20Postgres-f4c95d?style=flat-square)](https://neon.tech/)
[![MCP](https://img.shields.io/badge/agent%20surface-MCP-34d399?style=flat-square)](#-mcp)

[Live App](https://stewardship-ledger.vercel.app) · [Evidence Atlas](https://stewardship-ledger.vercel.app/atlas) · [Saved Briefs](https://stewardship-ledger.vercel.app/briefs) · [API](https://stewardship-ledger.vercel.app/api/health) · [MCP](https://stewardship-ledger.vercel.app/mcp) · [Issues](https://github.com/aniruddhaadak80/stewardship-ledger/issues)

</div>

> **Educational governance tool.** Stewardship Ledger helps people make assumptions and trade-offs visible. It does not certify a model, authorize a deployment, or replace legal, clinical, security, or affected-person review.

## ✨ Features

- **Alignment Evidence Atlas** — browse curated papers, frontier reports, podcasts, commentary lenses, and open-source tools with claims, limitations, evidence grades, topics, and publisher links.
- **Live research perimeter** — refresh arXiv, OpenAlex, and Apple Podcasts RSS records while retaining sealed curated fallbacks when a provider is unavailable.
- **Plain-language briefs** — select sources, ask a question, save a deterministic synthesis with coverage, confidence, action steps, open questions, and SHA-384 provenance.
- **Relational control-risk engine** — five explainable factors: autonomy, irreversibility, oversight gap, impact radius, and voice gap.
- **Real case CRUD** — create, read, update, retire, search, and filter persistent stewardship cases.
- **Replayable evidence** — each case revision and brief stores a SHA-384 digest linked to its previous digest.
- **Agent surface** — REST plus JSON-RPC MCP tools for cases, sources, refreshes, synthesis, brief mutations, and chain verification.
- **Care-centered UX** — consent, appeal, reversibility, and accountable human contact are visible controls.
- **Zero-key local start** — the core app and atlas run with an in-memory adapter; Neon is only needed for durable production data.

## 🧭 Why this exists

Frontier-agent safety is often presented as a leaderboard, a policy document, or a single red/green score. Those views can hide the relationships that matter in practice: who has authority, who can stop an action, who can appeal, and whether the people affected can change the outcome.

The Alignment Evidence Atlas adds a second layer: a bounded, refreshable reading surface for primary research, first-party reports, practitioner commentary, podcasts, and tools. Each record keeps its claim separate from its limitation, and every synthesis keeps source IDs attached. Stewardship Ledger turns those relationships into a case that a builder, reviewer, or coding agent can inspect and revise together.

### Jobs-to-be-done

1. **A reader can** open a source record or commentary lens **so that** a claim, limitation, evidence grade, and original publisher link stay visible together.
2. **A builder can** create and update a case **so that** a safety decision has an owner, an explicit context, and a reversible path.
3. **A reviewer can** select sources, save a plain-language brief, inspect coverage gaps, and replay the brief seal **so that** synthesis is not mistaken for certainty.
4. **A coding agent can** call the public MCP tools **so that** it can help maintain cases, source records, and briefs without a private integration or hidden database.

## 🏗️ System architecture

```mermaid
flowchart LR
  U[Reader or builder] --> UI[Next.js App Router]
  A[Browser agent console] --> RPC[JSON-RPC MCP]
  UI --> REST[REST route handlers]
  RPC --> TOOL[Shared tool dispatcher]
  REST --> CASE[Case service]
  TOOL --> CASE
  CASE --> ENGINE[Deterministic risk engine]
  CASE --> SEAL[Case SHA-384 chain]
  CASE --> DB[(Neon Postgres)]
  FEED[arXiv + OpenAlex + RSS] --> PROVIDER[Research feed adapters]
  PROVIDER --> SOURCES[Source + commentary service]
  SOURCES --> BRIEF[Plain-language brief engine]
  BRIEF --> BRIEFSEAL[Sealed brief record]
  BRIEFSEAL --> DB
  SOURCES --> DB
  classDef data fill:#22d3ee,color:#04060c,stroke:#04060c
  classDef engine fill:#a78bfa,color:#04060c,stroke:#04060c
  classDef agent fill:#34d399,color:#04060c,stroke:#04060c
  classDef external fill:#fbbf24,color:#04060c,stroke:#04060c
  classDef risk fill:#fb7185,color:#04060c,stroke:#04060c
  classDef infra fill:#94a3b8,color:#04060c,stroke:#04060c
  class U,UI,REST,CASE,DB,SOURCES,BRIEFSEAL data
  class ENGINE,SEAL,BRIEF engine
  class A,RPC,TOOL agent
  class FEED,PROVIDER external
  class U risk
  class DB infra
```

The same case functions power the browser, REST handlers, and MCP dispatcher. The research adapter normalizes external records, keeps curated fallbacks available, and writes a stable source fingerprint. The brief engine is pure and deterministic; the database adapter is the only persistence boundary.

## 🔄 Data pipeline

```mermaid
flowchart TB
  Q[Public query or feed] --> N[Normalize fields]
  N --> C{Cache or live?}
  C -->|live| V[Validate publisher payload]
  C -->|offline| F[Sealed fallback sample]
  V --> M[Merge by normalized title]
  F --> M
  M --> R[Return source + freshness]
  R --> L[Show provenance in UI]
  classDef data fill:#22d3ee,color:#04060c,stroke:#04060c
  classDef engine fill:#a78bfa,color:#04060c,stroke:#04060c
  classDef agent fill:#34d399,color:#04060c,stroke:#04060c
  classDef external fill:#fbbf24,color:#04060c,stroke:#04060c
  classDef risk fill:#fb7185,color:#04060c,stroke:#04060c
  classDef infra fill:#94a3b8,color:#04060c,stroke:#04060c
  class Q,N,V,M,R,L data
  class C engine
  class F risk
  class Q external
  class R infra
```

`GET /api/feed` uses a 15-minute Next.js revalidation window. `POST /api/research/refresh` queries arXiv, OpenAlex, and the configured Apple Podcasts lookup/RSS path, then upserts records by stable ID or URL. If a provider is unavailable, the curated source shelf remains available and each record says whether it is live or sealed fallback.

## 🧭 Evidence-to-brief flow

```mermaid
flowchart LR
  P[Paper / report / podcast / commentary / tool] --> N[Normalize source]
  N --> G[Grade evidence + attach limitations]
  G --> S[Select source IDs]
  S --> B[Deterministic brief engine]
  B --> C[Coverage + confidence + actions]
  C --> H[Save source IDs and SHA-384 seal]
  H --> R[Review or revise]
  classDef data fill:#22d3ee,color:#04060c,stroke:#04060c
  classDef engine fill:#a78bfa,color:#04060c,stroke:#04060c
  classDef risk fill:#fb7185,color:#04060c,stroke:#04060c
  class P,N,G,S,H data
  class B,C engine
  class R risk
```

The synthesis is intentionally narrower than a universal answer engine. It groups selected records into six alignment themes, reports missing coverage, and turns the strongest theme into a testable next move.

## 🧮 Engine / algorithm flow

```mermaid
flowchart LR
  I[Case fields] --> N[Normalize + clamp 0..100]
  N --> A[Autonomy × .28]
  N --> R[(100 − reversibility) × .18]
  N --> O[(100 − oversight) × .22]
  N --> P[Impact × .20]
  N --> V[(100 − voice) × .12]
  A --> S[Weighted sum]
  R --> S
  O --> S
  P --> S
  V --> S
  S --> B[Band + factors + next moves]
  B --> U[Same result in UI, REST, MCP]
  classDef data fill:#22d3ee,color:#04060c,stroke:#04060c
  classDef engine fill:#a78bfa,color:#04060c,stroke:#04060c
  classDef agent fill:#34d399,color:#04060c,stroke:#04060c
  classDef external fill:#fbbf24,color:#04060c,stroke:#04060c
  classDef risk fill:#fb7185,color:#04060c,stroke:#04060c
  classDef infra fill:#94a3b8,color:#04060c,stroke:#04060c
  class I,N,A,R,O,P,V,S,B data
  class N,S,B,U engine
  class U agent
  class R,O risk
```

The result is an explainable signal, not a scientific claim. The UI exposes every contribution and the recommendations generated from weak controls.

## 🤖 Agent (MCP) flow

```mermaid
flowchart LR
  C[Coding agent] --> I[initialize]
  I --> L[tools/list]
  L --> T[Choose a tool]
  T --> C1[create_case]
  T --> C2[update_case]
  T --> R1[score_case]
  T --> S1[list_sources / get_source]
  T --> B1[preview_brief / save_brief]
  T --> V[verify_chain]
  C1 --> P[Persist + append seal]
  C2 --> P
  R1 --> E[Return score + preview seal]
  S1 --> D[Read provenance]
  B1 --> F[Save or revise sealed brief]
  V --> H[Replay links]
  P --> J[JSON-RPC result]
  E --> J
  D --> J
  F --> J
  H --> J
  classDef data fill:#22d3ee,color:#04060c,stroke:#04060c
  classDef engine fill:#a78bfa,color:#04060c,stroke:#04060c
  classDef agent fill:#34d399,color:#04060c,stroke:#04060c
  classDef external fill:#fbbf24,color:#04060c,stroke:#04060c
  classDef risk fill:#fb7185,color:#04060c,stroke:#04060c
  classDef infra fill:#94a3b8,color:#04060c,stroke:#04060c
  classDef verified fill:#34d399,color:#04060c,stroke:#04060c
  class C,I,L,T,J agent
  class C1,C2,P data
  class R1,E engine
  class V,H verified
  class T risk
  class J infra
```

The public endpoint is `POST /mcp`. The in-page console calls the same route, so a successful “create case” button really creates a persisted record.

## 🔐 Integrity / seal chain

```mermaid
flowchart LR
  G[Genesis seal] --> C1[Case 01]
  C1 --> C2[Case 02]
  C2 --> U[Update case 01]
  U --> C3[New revision]
  C3 --> V[Replay all records]
  V --> OK{Every link valid?}
  OK -->|yes| E[Evidence ready to share]
  OK -->|no| X[Report broken case id]
  classDef data fill:#22d3ee,color:#04060c,stroke:#04060c
  classDef engine fill:#a78bfa,color:#04060c,stroke:#04060c
  classDef agent fill:#34d399,color:#04060c,stroke:#04060c
  classDef external fill:#fbbf24,color:#04060c,stroke:#04060c
  classDef risk fill:#fb7185,color:#04060c,stroke:#04060c
  classDef infra fill:#94a3b8,color:#04060c,stroke:#04060c
  class C1,C2,U,C3,V data
  class G,E engine
  class OK,X risk
  class V infra
```

Each digest is `SHA-384(previousSeal ‖ canonicalJson({ input, score }))`. Retiring a case is a sealed revision, so a visible deletion does not erase the history that preceded it.

## 🚀 Deployment pipeline

```mermaid
flowchart TB
  W[Write change] --> C[Commit to main]
  C --> G[GitHub Actions]
  G --> L[Node 22 + npm ci]
  L --> Q[ESLint]
  Q --> T[Vitest unit suite]
  T --> B[Next.js production build]
  B --> V[Vercel production deploy]
  V --> E[Set DATABASE_URL]
  E --> H[HTTP health check]
  H --> P[Public alias verification]
  classDef data fill:#22d3ee,color:#04060c,stroke:#04060c
  classDef engine fill:#a78bfa,color:#04060c,stroke:#04060c
  classDef agent fill:#34d399,color:#04060c,stroke:#04060c
  classDef external fill:#fbbf24,color:#04060c,stroke:#04060c
  classDef risk fill:#fb7185,color:#04060c,stroke:#04060c
  classDef infra fill:#94a3b8,color:#04060c,stroke:#04060c
  class W,C,G,L,Q,B data
  class E,H,P external
  class V infra
  class Q risk
  class B engine
```

The app has no required API key for the core experience. Production persistence uses a pooled Neon connection; local development can run without it.

## 🧑‍🤝‍🧑 User journey

```mermaid
flowchart TD
  S[See a new research signal] --> Q[Open the method]
  Q --> N[Name a system + affected people]
  N --> C[Create a sealed case]
  C --> R[Read the factor breakdown]
  R --> E{Control gap?}
  E -->|yes| P[Add a safeguard or pause]
  E -->|no| T[Invite a critical reader]
  P --> C
  T --> A[Agent or human updates the record]
  A --> V[Replay the chain and export the decision]
  classDef data fill:#22d3ee,color:#04060c,stroke:#04060c
  classDef engine fill:#a78bfa,color:#04060c,stroke:#04060c
  classDef agent fill:#34d399,color:#04060c,stroke:#04060c
  classDef external fill:#fbbf24,color:#04060c,stroke:#04060c
  classDef risk fill:#fb7185,color:#04060c,stroke:#04060c
  classDef infra fill:#94a3b8,color:#04060c,stroke:#04060c
  class S,Q,N,C,R,P,T,A,V data
  class E risk
  class A agent
  class S external
  class V infra
```

## 🚀 Quickstart

```bash
git clone https://github.com/aniruddhaadak80/stewardship-ledger.git
cd stewardship-ledger
npm install
npm run dev
```

Open `http://localhost:3000`. No environment variables are required for the local demo: cases use an in-memory adapter and the app seeds four example records.

For durable local or production data, copy `.env.example` to `.env.local`, set a pooled Neon `DATABASE_URL`, and apply `db/schema.sql` to the database. The Vercel production environment needs only:

```bash
vercel env add DATABASE_URL
```

Do not commit `.env.local` or database credentials.

### Useful commands

```bash
npm run lint
npm test
npm run build
npm run start
```

## 🔌 API

Base URL: `https://stewardship-ledger.vercel.app`

### Health

```bash
curl https://stewardship-ledger.vercel.app/api/health
```

### List and create

```bash
curl "https://stewardship-ledger.vercel.app/api/cases?status=active"

curl -X POST https://stewardship-ledger.vercel.app/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Benefits navigator pilot",
    "system": "Public-service eligibility agent",
    "context": "The agent helps residents discover support and routes complex cases to a caseworker.",
    "autonomy": 42,
    "reversibility": 88,
    "oversight": 73,
    "affected": 84,
    "voice": 82,
    "safeguards": "No final decisions, translated explanations, appeal handoff, weekly fairness review.",
    "owner": "Digital rights clinic"
  }'
```

The response contains `case.id`, `case.score`, and `case.seal.digest`. Read it back with:

```bash
curl https://stewardship-ledger.vercel.app/api/cases/<case-id>
```

### Update, retire, score, feed, verify

```bash
curl -X PATCH https://stewardship-ledger.vercel.app/api/cases/<case-id> \
  -H "Content-Type: application/json" \
  -d '{"oversight": 84, "voice": 90}'

curl -X DELETE https://stewardship-ledger.vercel.app/api/cases/<case-id>

curl -X POST https://stewardship-ledger.vercel.app/api/score \
  -H "Content-Type: application/json" \
  -d '{"case":{"title":"Preview","autonomy":74,"reversibility":36,"oversight":48,"affected":69,"voice":42}}'

curl https://stewardship-ledger.vercel.app/api/feed
curl https://stewardship-ledger.vercel.app/api/verify
```

### Research atlas and sealed briefs

```bash
curl https://stewardship-ledger.vercel.app/api/research
curl https://stewardship-ledger.vercel.app/api/research/sources/overclaimbench-2609-20812
curl -X POST https://stewardship-ledger.vercel.app/api/briefs/preview \\
  -H "Content-Type: application/json" \\
  -d '{"sourceIds":["overclaimbench-2609-20812","bootstrapped-monitoring-2606-11998"],"question":"What should an agent builder verify?"}'

curl -X POST https://stewardship-ledger.vercel.app/api/briefs \\
  -H "Content-Type: application/json" \\
  -d '{"sourceIds":["overclaimbench-2609-20812"],"question":"What does this source establish?","title":"Source check"}'

curl https://stewardship-ledger.vercel.app/api/briefs
```

`POST /api/research/refresh` is the explicit live-provider refresh. Brief responses include `sourceIds`, `themes`, `coverage`, `confidence`, `evidenceScore`, `unsettled`, `actionSteps`, and a SHA-384 `seal`.

The complete machine-readable contract is available at `/api/openapi`.

## 🧰 MCP setup

The endpoint accepts JSON-RPC 2.0 requests at `/mcp`. A remote MCP client can use the checked-in manifest:

```json
{
  "mcpServers": {
    "stewardship-ledger": {
      "transport": "streamable-http",
      "url": "https://stewardship-ledger.vercel.app/mcp"
    }
  }
}
```

Available tools:

- `list_cases` — read and filter the ledger.
- `get_case` — read factors, history, and seal.
- `create_case` — persist a new sealed case.
- `update_case` — patch and reseal a case.
- `score_case` — preview a score without persistence.
- `verify_chain` — replay all stored case links.
- `retire_case` — preserve a case while marking it retired.
- `list_sources` — browse curated and refreshed evidence records.
- `get_source` — read a claim, limitation, grade, topics, and source fingerprint.
- `list_commentary` — read attributed lenses and counterpoints.
- `refresh_sources` — refresh public arXiv, OpenAlex, and podcast providers.
- `preview_brief` — synthesize plain language without persistence.
- `save_brief` — save a source-attached, SHA-384-sealed brief.
- `list_briefs` — list saved evidence briefs.
- `get_brief` — read one saved synthesis and seal.
- `update_brief` — revise a brief and append a new seal.
- `archive_brief` — archive a brief while retaining its record.

Example tool call:

```bash
curl -X POST https://stewardship-ledger.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"score_case","arguments":{"case":{"title":"MCP preview","autonomy":70,"reversibility":40,"oversight":50,"affected":65,"voice":45}}}}'
```

## 📁 Project map

| Route | What it does |
| --- | --- |
| `/` | Landing page with the relational lattice, four usefulness jobs, and the live signal. |
| `/atlas` | Searchable evidence atlas with source filters, animated theme map, commentary lenses, refresh, and brief creation. |
| `/sources/[id]` | Source detail with claim, limitation, evidence grade, commentary, provenance, and sealed-brief action. |
| `/briefs` | Saved evidence brief library with source selection, create, archive, and provenance links. |
| `/briefs/[id]` | Brief detail with plain-language synthesis, coverage, action steps, source cards, edit, and seal record. |
| `/ledger` | Searchable CRUD ledger with stats, create form, filters, and retire action. |
| `/cases/[id]` | Dynamic case detail with factor bars, edit form, recommendations, revision history, and seal replay. |
| `/method` | Care-centered method page with a live score workbench. |
| `/agent` | In-page JSON-RPC console with read, score, mutation, and chain verification actions. |
| `/api/health` | Service and storage health response. |
| `/api/cases` | `GET` list and `POST` create. |
| `/api/cases/[id]` | `GET`, `PATCH`, and `DELETE` (retire with preserved history). |
| `/api/score` | Deterministic score and preview seal endpoint. |
| `/api/feed` | Cached arXiv/OpenAlex normalization with offline fallback. |
| `/api/research` | `GET` curated/live source shelf and commentary; `POST` refresh. |
| `/api/research/refresh` | `POST` public provider refresh with sealed fallback behavior. |
| `/api/research/sources/[id]` | `GET` one source with attributed commentary. |
| `/api/briefs` | `GET` saved briefs; `POST` create and seal a brief. |
| `/api/briefs/preview` | `POST` deterministic plain-language synthesis without persistence. |
| `/api/briefs/[id]` | `GET`, `PATCH`, and `DELETE` saved brief operations. |
| `/api/verify` | Full case chain replay and optional per-case seal check. |
| `/api/openapi` | OpenAPI 3.1 contract for cases, research, briefs, and MCP. |
| `/mcp` | JSON-RPC MCP endpoint. |
| `public/mcp.json` | Remote MCP client manifest. |
| `db/schema.sql` | Neon table and index schema. |

## 🗺️ Roadmap

### Now · Make the evidence and decision inspectable

- [x] Create, update, retire, and replay a stewardship case.
- [x] Show all five scoring factors and the next responsible move.
- [x] Add live research context with a sealed offline fallback.
- [x] Build a curated evidence atlas with source claims, limitations, evidence grades, topics, and commentary counterpoints.
- [x] Save deterministic plain-language briefs with source IDs, coverage, confidence, action steps, and SHA-384 seals.
- [x] Let an agent mutate cases and briefs through the same REST/MCP surface.

```mermaid
flowchart LR
  A[Context] --> B[Case]
  B --> C[Score]
  C --> D[Seal]
  D --> E[Replay]
  classDef data fill:#22d3ee,color:#04060c,stroke:#04060c
  classDef engine fill:#a78bfa,color:#04060c,stroke:#04060c
  classDef agent fill:#34d399,color:#04060c,stroke:#04060c
  classDef external fill:#fbbf24,color:#04060c,stroke:#04060c
  classDef risk fill:#fb7185,color:#04060c,stroke:#04060c
  classDef infra fill:#94a3b8,color:#04060c,stroke:#04060c
  class A,B data
  class C,D engine
  class E agent
```

### Next · Add independent review without adding a black box

- [ ] Add signed review links so another person can annotate a case or brief.
- [ ] Add scenario presets for loss of oversight, manipulation, and uncontrolled AI R&D.
- [ ] Add a human-readable export that pairs case assumptions with the selected source records.
- [ ] Add authentication, authorization, rate limiting, and abuse controls before storing sensitive records.

```mermaid
flowchart TB
  S[Shared case] --> R[Reviewer]
  R --> Q[Questions]
  Q --> P[Patch]
  P --> N[New seal]
  N --> B[Public brief]
  classDef data fill:#22d3ee,color:#04060c,stroke:#04060c
  classDef engine fill:#a78bfa,color:#04060c,stroke:#04060c
  classDef agent fill:#34d399,color:#04060c,stroke:#04060c
  classDef external fill:#fbbf24,color:#04060c,stroke:#04060c
  classDef risk fill:#fb7185,color:#04060c,stroke:#04060c
  classDef infra fill:#94a3b8,color:#04060c,stroke:#04060c
  class S,Q,P,N,B data
  class R risk
  class N engine
  class B infra
```

### Later · Build a plural evidence commons

- [ ] Add privacy-preserving review aggregation.
- [ ] Add benchmark adapters that keep provenance attached to every claim.
- [ ] Add a red-team mode that proposes safer controls without claiming certification.

```mermaid
flowchart LR
  E[Evaluation adapters] --> P[Provenance graph]
  R[Reviewer notes] --> P
  P --> S[Synthesis]
  S --> C[Case patch]
  C --> H[Human decision]
  classDef data fill:#22d3ee,color:#04060c,stroke:#04060c
  classDef engine fill:#a78bfa,color:#04060c,stroke:#04060c
  classDef agent fill:#34d399,color:#04060c,stroke:#04060c
  classDef external fill:#fbbf24,color:#04060c,stroke:#04060c
  classDef risk fill:#fb7185,color:#04060c,stroke:#04060c
  classDef infra fill:#94a3b8,color:#04060c,stroke:#04060c
  class E,P,S,C data
  class R external
  class S engine
  class H risk
```

## 🛡️ Safety and evidence notes

- The score is a transparent heuristic with itemized factors. It is not a probability, certification, or substitute for expert review.
- Evidence grades describe the kind and strength of a source, not the truth of its conclusion. A high score is a reason to inspect the method, limitations, and counterarguments.
- External research links are attribution and discovery aids. Open the publisher record before relying on a claim; the atlas is not a complete mirror of the internet.
- Commentary is labeled separately from primary evidence and always carries a counterpoint.
- Public writes are intentionally easy to inspect. Add authentication, authorization, rate limiting, and abuse controls before storing sensitive or operational records.
- SHA-384 chaining is tamper evidence, not encryption or access control.
- The live feed is a reading aid, not a live safety alert or operational monitoring system.

## Feed attribution

The feed normalizes public records from [arXiv](https://arxiv.org/), [OpenAlex](https://openalex.org/), and Apple Podcasts RSS/lookup for configured public shows. The curated shelf also links to the [International AI Safety Report 2026](https://internationalaisafetyreport.org/), [METR Frontier Risk Report](https://metr.org/blog/2026-01-29-frontier-risk-report/), [AI Safety Priorities](https://aisafetypriorities.org/), [Stanford HAI’s AI Index](https://hai.stanford.edu/ai-index/2026-ai-index-report/responsible-ai), [Civic AI care research](https://civic.ai/care-ai/), Alignment/E responsibly, 80,000 Hours, Dwarkesh, Kairos.fm, PaperDive, Redwood, DeepMind red teams, Frontier Systems, Big Technology, and related public records. Publisher names, dates, claims, limitations, and links remain attached to every item.

## 🤝 Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Small, focused contributions with a clear stewardship outcome are especially welcome.

## 📄 License

MIT. See [LICENSE](LICENSE).
