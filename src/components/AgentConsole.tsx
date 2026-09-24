"use client";

import { Check, Clipboard, Code2, LoaderCircle, Play, Plus, ShieldCheck, Sparkles, Terminal, TriangleAlert } from "lucide-react";
import { useState } from "react";

type JsonRpcPayload = { jsonrpc: "2.0"; id: number; method: string; params?: Record<string, unknown> };

export function AgentConsole() {
  const [response, setResponse] = useState<unknown>(null);
  const [label, setLabel] = useState("No tool call yet");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function call(method: string, params: Record<string, unknown> = {}, nextLabel = method) {
    setBusy(true);
    setError("");
    setLabel(nextLabel);
    try {
      const payload: JsonRpcPayload = { jsonrpc: "2.0", id: Date.now(), method, params };
      const result = await fetch("/mcp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const value = await result.json();
      setResponse(value);
      if (!result.ok) {
        throw new Error("The MCP endpoint returned an error.");
      }
    } catch (callError) {
      setError(callError instanceof Error ? callError.message : "The MCP call failed.");
    } finally {
      setBusy(false);
    }
  }

  async function copyResponse() {
    if (!response) {
      return;
    }
    await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="agent-layout">
      <section className="agent-panel">
        <div className="agent-panel__head"><h2><Terminal size={18} aria-hidden="true" /> MCP workbench</h2><span>JSON-RPC 2.0</span></div>
        <div className="agent-body">
          <p className="agent-intro">This is the same mutating surface coding agents can call. Run a read, score a scenario, or create a real sealed case in the public ledger.</p>
          <div className="agent-actions">
            <button className="agent-action" type="button" onClick={() => void call("tools/list", {}, "List available tools")} disabled={busy}><span><strong>Discover tools</strong><small>tools/list · read-only</small></span><Code2 size={17} aria-hidden="true" /></button>
            <button className="agent-action" type="button" onClick={() => void call("tools/call", { name: "score_case", arguments: { case: { title: "Preview scenario", system: "High-autonomy triage agent", context: "A scenario for the public preview.", autonomy: 74, reversibility: 36, oversight: 48, affected: 69, voice: 42, safeguards: "Human approval is required before action.", owner: "Console preview" } } }, "Score a scenario")} disabled={busy}><span><strong>Score a scenario</strong><small>score_case · no persistence</small></span><Sparkles size={17} aria-hidden="true" /></button>
            <button className="agent-action" type="button" onClick={() => void call("tools/call", { name: "create_case", arguments: { title: `MCP intake ${new Date().toISOString().slice(0, 16)}`, system: "Agent-created stewardship case", context: "Created through the public MCP mutating tool.", autonomy: 58, reversibility: 61, oversight: 57, affected: 53, voice: 64, safeguards: "Human review, reversible actions, and a public revision trail.", owner: "MCP agent" } }, "Create a sealed case")} disabled={busy}><span><strong>Create a sealed case</strong><small>create_case · mutates the ledger</small></span><Plus size={17} aria-hidden="true" /></button>
            <button className="agent-action" type="button" onClick={() => void call("tools/call", { name: "verify_chain", arguments: {} }, "Verify the seal chain")} disabled={busy}><span><strong>Verify the seal chain</strong><small>verify_chain · replay every revision</small></span><ShieldCheck size={17} aria-hidden="true" /></button>
          </div>
          {error && <div className="chain-result chain-result--invalid"><TriangleAlert size={16} aria-hidden="true" /> {error}</div>}
        </div>
      </section>

      <section className="agent-response">
        <div className="agent-response__bar"><span>{label}</span><button className="button-quiet" type="button" onClick={() => void copyResponse()} disabled={!response}>{copied ? <Check size={14} aria-hidden="true" /> : <Clipboard size={14} aria-hidden="true" />} {copied ? "Copied" : "Copy JSON"}</button></div>
        {busy ? <div className="agent-response__empty"><LoaderCircle className="spin" size={21} aria-hidden="true" /><span>Calling the public endpoint…</span></div> : response ? <pre>{JSON.stringify(response, null, 2)}</pre> : <div className="agent-response__empty"><Play size={21} aria-hidden="true" /><span>Choose an action to see a real JSON-RPC response.</span></div>}
      </section>
    </div>
  );
}
