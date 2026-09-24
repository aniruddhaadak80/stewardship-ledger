"use client";

import { useState } from "react";
import { LoaderCircle, Plus, Save, X } from "lucide-react";
import type { CaseDraft, CaseStatus } from "@/lib/types";

const initialDraft: CaseDraft = {
  title: "",
  system: "",
  context: "",
  autonomy: 40,
  reversibility: 60,
  oversight: 60,
  affected: 40,
  voice: 50,
  safeguards: "",
  owner: "",
  status: "active",
};

const fields: Array<{ key: "autonomy" | "reversibility" | "oversight" | "affected" | "voice"; label: string; low: string; high: string }> = [
  { key: "autonomy", label: "Autonomy", low: "Suggestive", high: "Acts on its own" },
  { key: "reversibility", label: "Reversibility", low: "Hard to undo", high: "Easy to undo" },
  { key: "oversight", label: "Oversight", low: "No accountable human", high: "Meaningful review" },
  { key: "affected", label: "Impact radius", low: "One person", high: "A population" },
  { key: "voice", label: "Affected voice", low: "No route back", high: "Consent + appeal" },
];

export function CaseForm({ initial, busy, onSave, onCancel }: { initial?: CaseDraft; busy?: boolean; onSave: (draft: CaseDraft) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<CaseDraft>(initial ?? initialDraft);

  function update(key: keyof CaseDraft, value: string | number) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draft);
  }

  return (
    <form className="case-form" onSubmit={submit}>
      <div className="form-heading">
        <div>
          <span className="eyebrow">{initial ? "Edit the record" : "New public record"}</span>
          <h2>{initial ? "Change the case" : "Name the system"}</h2>
        </div>
        <button className="icon-button" type="button" onClick={onCancel} aria-label="Close form"><X size={18} aria-hidden="true" /></button>
      </div>
      <div className="form-grid form-grid--text">
        <label>
          <span>Case title</span>
          <input required value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Municipal benefits navigator" />
        </label>
        <label>
          <span>System or model</span>
          <input required value={draft.system} onChange={(event) => update("system", event.target.value)} placeholder="e.g. Public-service agent" />
        </label>
      </div>
      <label>
        <span>What does it touch?</span>
        <textarea required rows={3} value={draft.context} onChange={(event) => update("context", event.target.value)} placeholder="Name the people, authority, environment, and consequence." />
      </label>
      <div className="factor-inputs">
        {fields.map((field) => (
          <label className="range-field" key={field.key}>
            <span className="range-field__top"><strong>{field.label}</strong><b>{draft[field.key]}</b></span>
            <input type="range" min="0" max="100" value={draft[field.key]} onChange={(event) => update(field.key, Number(event.target.value))} />
            <span className="range-field__ends"><small>{field.low}</small><small>{field.high}</small></span>
          </label>
        ))}
      </div>
      <label>
        <span>Safeguards already in place</span>
        <textarea rows={3} value={draft.safeguards} onChange={(event) => update("safeguards", event.target.value)} placeholder="What can a person see, stop, appeal, or change?" />
      </label>
      <div className="form-grid form-grid--text">
        <label>
          <span>Steward / owner</span>
          <input required value={draft.owner} onChange={(event) => update("owner", event.target.value)} placeholder="Who is accountable?" />
        </label>
        <label>
          <span>Status</span>
          <select value={draft.status ?? "active"} onChange={(event) => update("status", event.target.value as CaseStatus)}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="review">In review</option>
            <option value="retired">Retired</option>
          </select>
        </label>
      </div>
      <div className="form-actions">
        <button className="button-secondary" type="button" onClick={onCancel}>Cancel</button>
        <button className="button-primary" type="submit" disabled={busy}>
          {busy ? <LoaderCircle className="spin" size={17} aria-hidden="true" /> : initial ? <Save size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
          {busy ? "Saving…" : initial ? "Save revision" : "Create sealed case"}
        </button>
      </div>
    </form>
  );
}
