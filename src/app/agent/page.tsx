import { AgentConsole } from "@/components/AgentConsole";

export const metadata = {
  title: "Agent console",
  description: "Call the public Stewardship Ledger MCP tools from a live browser console.",
};

export default function AgentPage() {
  return (
    <div className="page-frame">
      <div className="page-header"><div><span className="eyebrow">Machine-readable surface</span><h1>Let an agent leave a better trace.</h1></div><p>The console calls the public JSON-RPC endpoint at <code>/mcp</code>. The mutation is real: a created case appears in the ledger and receives a seal.</p></div>
      <AgentConsole />
    </div>
  );
}
