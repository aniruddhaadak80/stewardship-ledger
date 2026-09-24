"use client";

import { LoaderCircle, Plus, Search, ShieldCheck, SlidersHorizontal, Workflow } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CaseCard, EmptyState } from "@/components/CaseCard";
import { CaseForm } from "@/components/CaseForm";
import type { CaseDraft, CaseRecord } from "@/lib/types";

export function LedgerClient({ openNew = false }: { openNew?: boolean }) {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(openNew);
  const [editing, setEditing] = useState<CaseRecord | null>(null);
  const [notice, setNotice] = useState("");

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("q", query.trim());
      }
      if (status !== "all") {
        params.set("status", status);
      }
      const response = await fetch(`/api/cases?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Could not load the ledger.");
      }
      const payload = (await response.json()) as { cases: CaseRecord[] };
      setCases(payload.cases);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load the ledger.");
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadCases();
    });
  }, [loadCases]);

  const stats = useMemo(() => {
    const elevated = cases.filter((record) => record.score.band === "high" || record.score.band === "critical").length;
    const average = cases.length ? Math.round(cases.reduce((total, record) => total + record.score.score, 0) / cases.length) : 0;
    return { total: cases.length, elevated, average, review: cases.filter((record) => record.status === "review").length };
  }, [cases]);

  async function saveCase(draft: CaseDraft) {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(editing ? `/api/cases/${editing.id}` : "/api/cases", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = (await response.json()) as { case?: CaseRecord; error?: string };
      if (!response.ok || !payload.case) {
        throw new Error(payload.error ?? "The case could not be saved.");
      }
      setShowForm(false);
      setEditing(null);
      setNotice(editing ? `Revision ${payload.case.version} sealed and saved.` : "Case created and sealed into the ledger.");
      await loadCases();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The case could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function retireCase(id: string) {
    if (!window.confirm("Retire this case? Its revisions and seal will remain in the audit chain.")) {
      return;
    }
    setNotice("");
    try {
      const response = await fetch(`/api/cases/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "The case could not be retired.");
      }
      setNotice("Case retired. Its evidence trail is still replayable.");
      await loadCases();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The case could not be retired.");
    }
  }

  return (
    <div className="page-frame">
      <div className="page-header">
        <div>
          <span className="eyebrow">The public record</span>
          <h1>Keep the power, name the care.</h1>
        </div>
        <p>Every case is a small act of governance: describe the authority, expose the trade-offs, and leave a trail another person can replay.</p>
      </div>

      <div className="stats-grid" aria-label="Ledger summary">
        <div className="stat-card"><span>Visible cases</span><strong>{stats.total}</strong><small>Shared working records</small></div>
        <div className="stat-card"><span>Average signal</span><strong>{stats.average}</strong><small>Out of 100</small></div>
        <div className="stat-card"><span>Elevated</span><strong>{stats.elevated}</strong><small>High or red line</small></div>
        <div className="stat-card"><span>In review</span><strong>{stats.review}</strong><small>Needs a human pass</small></div>
      </div>

      {notice && <div className="feed-error" role="status"><ShieldCheck size={16} aria-hidden="true" /> {notice}</div>}

      <div className="ledger-toolbar">
        <div className="toolbar-filters">
          <label className="search-field"><Search size={16} aria-hidden="true" /><span className="sr-only">Search cases</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cases" /></label>
          <label className="select-field"><SlidersHorizontal size={15} aria-hidden="true" /><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="review">In review</option><option value="draft">Draft</option><option value="retired">Retired</option></select></label>
        </div>
        <div className="toolbar-actions">
          <button className="button-secondary" type="button" onClick={() => void loadCases()}><Workflow size={16} aria-hidden="true" /> Refresh</button>
          <button className="button-primary" type="button" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} aria-hidden="true" /> New case</button>
        </div>
      </div>

      {showForm && <div className="form-drawer"><CaseForm key={editing?.id ?? "new"} initial={editing ?? undefined} busy={busy} onSave={(draft) => void saveCase(draft)} onCancel={() => { setShowForm(false); setEditing(null); }} /></div>}

      {loading ? <div className="loading-shell"><LoaderCircle className="spin" size={20} aria-hidden="true" /> Loading the shared record…</div> : cases.length ? <div className="case-grid">{cases.map((record) => <CaseCard key={record.id} record={record} onRetire={(id) => void retireCase(id)} />)}</div> : <EmptyState />}
    </div>
  );
}
