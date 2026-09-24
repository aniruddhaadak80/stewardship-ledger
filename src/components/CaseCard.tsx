import { AlertTriangle, ArrowUpRight, CheckCircle2, Fingerprint, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import type { CaseRecord } from "@/lib/types";

const bandLabel = { low: "contained", watch: "watch closely", high: "high signal", critical: "red line" } as const;

export function ScoreMark({ score, band, compact = false }: { score: number; band: CaseRecord["score"]["band"]; compact?: boolean }) {
  return (
    <div className={`score-mark ${compact ? "score-mark--compact" : ""}`} aria-label={`${score} out of 100, ${band} signal`}>
      <div className="score-mark__ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}>
        <div className="score-mark__core"><strong>{score}</strong><span>/100</span></div>
      </div>
      {!compact && <span className={`band-pill band-pill--${band}`}>{bandLabel[band]}</span>}
    </div>
  );
}

export function FactorBar({ label, value, contribution, tone }: { label: string; value: number; contribution: number; tone: string }) {
  return (
    <div className="factor-row">
      <div className="factor-row__label"><span>{label}</span><strong>{value}/100</strong></div>
      <div className="factor-track"><span className={`factor-fill factor-fill--${tone}`} style={{ width: `${Math.min(100, Math.max(4, value))}%` }} /></div>
      <small>+{contribution.toFixed(1)} points</small>
    </div>
  );
}

export function CaseCard({ record, onRetire }: { record: CaseRecord; onRetire?: (id: string) => void }) {
  return (
    <article className="case-card">
      <div className="case-card__topline">
        <span className={`status-chip status-chip--${record.status}`}>{record.status}</span>
        <span className="case-card__date">{new Date(record.updatedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
      </div>
      <div className="case-card__body">
        <ScoreMark score={record.score.score} band={record.score.band} />
        <div>
          <p className="card-kicker">{record.system}</p>
          <h3>{record.title}</h3>
          <p className="case-card__context">{record.context}</p>
        </div>
      </div>
      <div className="case-card__signals">
        {record.score.factors.slice(0, 3).map((factor) => <span key={factor.key} className={`mini-signal mini-signal--${factor.tone}`}>{factor.label}</span>)}
      </div>
      <div className="case-card__footer">
        <span className="owner-line"><Shield size={14} aria-hidden="true" /> {record.owner}</span>
        <div className="case-card__actions">
          {onRetire && <button className="icon-button" type="button" onClick={() => onRetire(record.id)} aria-label={`Retire ${record.title}`} title="Retire case"><AlertTriangle size={16} aria-hidden="true" /></button>}
          <Link className="card-link" href={`/cases/${record.id}`}>Open case <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      </div>
    </article>
  );
}

export function SealMark({ digest, valid = true }: { digest: string; valid?: boolean }) {
  return (
    <div className={`seal-mark ${valid ? "" : "seal-mark--invalid"}`}>
      {valid ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}
      <Fingerprint size={15} aria-hidden="true" />
      <span>{digest.slice(0, 18)}…</span>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="empty-state">
      <Sparkles size={22} aria-hidden="true" />
      <h3>No cases match that view.</h3>
      <p>Clear the filters or add a new case to keep the shared evidence growing.</p>
    </div>
  );
}
