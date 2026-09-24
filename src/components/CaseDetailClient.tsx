"use client";

import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, ClipboardCheck, Edit3, History, LoaderCircle, Save, ShieldAlert, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CaseForm } from "@/components/CaseForm";
import { FactorBar, ScoreMark, SealMark } from "@/components/CaseCard";
import type { CaseDraft, CaseRecord } from "@/lib/types";

type ChainResult = { valid: boolean; checked: number; brokenAt: string | null; head: string; caseSealValid?: boolean };

function toDraft(record: CaseRecord): CaseDraft {
  return {
    title: record.title,
    system: record.system,
    context: record.context,
    autonomy: record.autonomy,
    reversibility: record.reversibility,
    oversight: record.oversight,
    affected: record.affected,
    voice: record.voice,
    safeguards: record.safeguards,
    owner: record.owner,
    status: record.status,
  };
}

export function CaseDetailClient({ id }: { id: string }) {
  const [record, setRecord] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chain, setChain] = useState<ChainResult | null>(null);
  const [notice, setNotice] = useState("");
  const [notFound, setNotFound] = useState(false);
  const router = useRouter();

  const loadCase = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cases/${id}`);
      if (response.status === 404) {
        setNotFound(true);
        return;
      }
      if (!response.ok) {
        throw new Error("Could not load this case.");
      }
      const payload = (await response.json()) as { case: CaseRecord };
      setRecord(payload.case);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load this case.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadCase();
    });
  }, [loadCase]);

  async function saveCase(draft: CaseDraft) {
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch(`/api/cases/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const payload = (await response.json()) as { case?: CaseRecord; error?: string };
      if (!response.ok || !payload.case) {
        throw new Error(payload.error ?? "The revision could not be saved.");
      }
      setRecord(payload.case);
      setEditing(false);
      setNotice(`Revision ${payload.case.version} sealed and saved.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The revision could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function verifyChain() {
    setNotice("");
    try {
      const response = await fetch(`/api/verify?id=${encodeURIComponent(id)}`);
      const payload = (await response.json()) as ChainResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "The chain could not be verified.");
      }
      setChain(payload);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The chain could not be verified.");
    }
  }

  async function retireCase() {
    if (!window.confirm("Retire this case? Its revisions and seal will remain in the audit chain.")) {
      return;
    }
    const response = await fetch(`/api/cases/${id}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/ledger");
    }
  }

  if (loading) {
    return <div className="page-frame"><div className="loading-shell"><LoaderCircle className="spin" size={20} aria-hidden="true" /> Replaying this case…</div></div>;
  }

  if (notFound || !record) {
    return <div className="page-frame"><div className="not-found"><div><h1>404</h1><p>This case is not in the public record.</p><Link className="button-primary" href="/ledger">Back to the ledger</Link></div></div></div>;
  }

  return (
    <div className="page-frame">
      <div className="detail-header">
        <div>
          <Link className="detail-back" href="/ledger"><ArrowLeft size={15} aria-hidden="true" /> Back to the ledger</Link>
          <div className="detail-meta"><span>{record.system}</span><span>Revision {record.version}</span><span>{record.status}</span></div>
          <h1>{record.title}</h1>
        </div>
        <SealMark digest={record.seal.digest} valid={chain?.caseSealValid !== false} />
      </div>

      {notice && <div className="feed-error" role="status"><ShieldAlert size={16} aria-hidden="true" /> {notice}</div>}

      {editing ? <div className="form-drawer"><CaseForm initial={toDraft(record)} busy={saving} onSave={(draft) => void saveCase(draft)} onCancel={() => setEditing(false)} /></div> : null}

      <div className="detail-layout">
        <div>
          <section className="detail-panel">
            <div className="detail-panel__head"><h2>Control-risk reading</h2><span>Deterministic / explainable</span></div>
            <div className="detail-score">
              <ScoreMark score={record.score.score} band={record.score.band} />
              <div className="detail-score__copy"><h2>{record.score.band === "critical" ? "Pause and escalate." : record.score.band === "high" ? "Controls need work." : "A workable starting point."}</h2><p>{record.score.summary}</p><div className="detail-actions"><button className="button-secondary" type="button" onClick={() => setEditing(true)}><Edit3 size={15} aria-hidden="true" /> Edit case</button><button className="button-secondary" type="button" onClick={() => void verifyChain()}><ClipboardCheck size={15} aria-hidden="true" /> Replay seal chain</button></div></div>
            </div>
            <div className="factor-list">{record.score.factors.map((factor) => <FactorBar key={factor.key} label={factor.label} value={factor.value} contribution={factor.contribution} tone={factor.tone} />)}</div>
          </section>

          <section className="detail-panel" style={{ marginTop: 16 }}>
            <div className="detail-panel__head"><h2>Context and safeguards</h2><span>Human-readable record</span></div>
            <div className="detail-body"><div><h3>What does it touch?</h3><p>{record.context}</p></div><div><h3>Controls already named</h3><p>{record.safeguards}</p></div><div><h3>Accountable steward</h3><p>{record.owner}</p></div></div>
          </section>
        </div>

        <aside>
          <section className="detail-panel detail-panel--dark">
            <div className="detail-panel__head"><h2><History size={17} aria-hidden="true" /> Revision trail</h2><span>SHA-384 chain</span></div>
            <div className="detail-body"><ol className="history-list">{[...record.history].reverse().map((revision) => <li className="history-item" key={revision.id}><span className="history-dot" /><div><strong>{revision.action} · {revision.actor}</strong><small>{new Date(revision.at).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</small><small>{revision.seal.slice(0, 26)}…</small></div></li>)}</ol>{chain && <div className={`chain-result ${chain.valid && chain.caseSealValid !== false ? "" : "chain-result--invalid"}`}><CheckCircle2 size={16} aria-hidden="true" /><span>{chain.valid && chain.caseSealValid !== false ? `Verified ${chain.checked} links. Head: ${chain.head.slice(0, 20)}…` : `Chain break at ${chain.brokenAt ?? "case seal"}.`}</span></div>}</div>
          </section>

          <section className="detail-panel" style={{ marginTop: 16 }}>
            <div className="detail-panel__head"><h2>Next responsible move</h2><span>Suggested by engine</span></div>
            <div className="detail-body"><ul className="recommendation-list">{record.score.recommendations.map((recommendation) => <li key={recommendation}><Check size={15} aria-hidden="true" /><span>{recommendation}</span></li>)}</ul><div className="detail-actions"><button className="button-secondary" type="button" onClick={() => void retireCase()}><Trash2 size={15} aria-hidden="true" /> Retire case</button><button className="button-secondary" type="button" onClick={() => void verifyChain()}><Save size={15} aria-hidden="true" /> Verify now</button></div></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
