import { HeartHandshake, Link2, ShieldCheck } from "lucide-react";
import { MethodWorkbench } from "@/components/MethodWorkbench";
import { SignalFeed } from "@/components/SignalFeed";

export const metadata = {
  title: "Method",
  description: "Learn the care-centered method behind the Stewardship Ledger score and seal chain.",
};

export default function MethodPage() {
  return (
    <div className="page-frame">
      <section className="method-hero"><div><span className="eyebrow">A care-centered method</span><h1>Safety is a relationship, not a number.</h1></div><p>The score is a prompt for a better conversation. It does not certify a model or replace affected people, domain experts, or independent review.</p></section>
      <div className="method-grid">
        <article className="method-card"><span className="method-card__number">01 / NOTICE</span><h3>Start with the people affected.</h3><p>Name who can be helped, harmed, left out, or unable to contest the system before choosing a technical metric.</p></article>
        <article className="method-card"><span className="method-card__number">02 / MAP</span><h3>Make power visible.</h3><p>Autonomy, reversibility, oversight, impact, and voice form a relationship map. No factor is allowed to hide inside an average.</p></article>
        <article className="method-card"><span className="method-card__number">03 / RESPOND</span><h3>Leave a route back.</h3><p>A good case ends with a control a person can use: pause, appeal, revise, roll back, or escalate to someone accountable.</p></article>
      </div>
      <MethodWorkbench />
      <section className="section-block"><div className="section-heading"><div><span className="eyebrow">Read the room</span><h2 className="section-title">Research is part of the interface.</h2></div><p className="section-lede">The ledger links to public safety and responsible-AI research. Treat the feed as context, not as a substitute for local knowledge or lived experience.</p></div><SignalFeed compact /></section>
      <section className="section-block"><div className="feature-grid"><article className="feature-card"><span className="feature-icon"><ShieldCheck size={20} aria-hidden="true" /></span><h3>Evidence with a boundary</h3><p>Scores are deterministic and inspectable, but they inherit the assumptions of the case maker. The UI keeps those assumptions in view.</p></article><article className="feature-card"><span className="feature-icon"><HeartHandshake size={20} aria-hidden="true" /></span><h3>Care as infrastructure</h3><p>Consent, appeal, explanation, and human contact are treated as controls with operational consequences.</p></article><article className="feature-card"><span className="feature-icon"><Link2 size={20} aria-hidden="true" /></span><h3>Portable by default</h3><p>Every case is available through REST and MCP, so an agent can help maintain the record without becoming a hidden gatekeeper.</p></article></div></section>
    </div>
  );
}
