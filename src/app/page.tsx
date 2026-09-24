import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, BookOpen, Fingerprint, HeartHandshake, Network, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { LatticeCanvas } from "@/components/LatticeCanvas";
import { SignalFeed } from "@/components/SignalFeed";

export default function Home() {
  return (
    <div className="page-frame">
      <section className="hero">
        <div>
          <span className="eyebrow">AI safety / care / control</span>
          <h1 className="display-title">Make AI power <em>answerable.</em></h1>
          <p className="hero-copy">Stewardship Ledger is a public casebook for high-autonomy systems. Model the trade-offs, name the people who can stop the action, and leave a seal another person can replay.</p>
          <div className="hero-actions" style={{ marginTop: 28 }}><Link className="button-primary" href="/ledger">Open the ledger <ArrowUpRight size={17} aria-hidden="true" /></Link><Link className="button-secondary" href="/method">Read the method <BookOpen size={16} aria-hidden="true" /></Link></div>
          <div className="hero-note" style={{ marginTop: 27 }}><ShieldCheck size={17} aria-hidden="true" /><span>Not a certification. A working agreement for making trade-offs visible before a system acts.</span></div>
        </div>
        <div className="hero__aside"><LatticeCanvas score={58} /><div className="hero-note"><Sparkles size={17} aria-hidden="true" /><span>The wow moment: change the relationship between autonomy, voice, and oversight, then watch the decision shape move.</span></div></div>
      </section>

      <section className="section-block" id="jobs">
        <div className="section-heading"><div><span className="eyebrow">The usefulness test</span><h2 className="section-title">Three jobs. One shared trail.</h2></div><p className="section-lede">A safety tool is only useful when a person can change a decision with it. These are the actions the product is built around.</p></div>
        <div className="job-grid">
          <article className="job-card"><span className="job-number">01</span><h3>Model the system</h3><p>A builder can create a case, change the authority and safeguards, and see the score respond in the same record.</p></article>
          <article className="job-card"><span className="job-number">02</span><h3>Interrogate the trade-off</h3><p>An auditor can inspect every weighted factor, the public research signal, and the exact seal that links each revision.</p></article>
          <article className="job-card"><span className="job-number">03</span><h3>Let an agent help</h3><p>A coding agent can call the same REST/MCP tools to read, score, create, and update cases without a private key.</p></article>
        </div>
      </section>

      <section className="section-block">
        <div className="quote-band"><div><blockquote>“The question is not whether a system is safe in the abstract. It is who gets to notice, stop, and change it.”</blockquote><cite>A working thesis for the public ledger</cite></div><div className="quote-band__aside"><HeartHandshake size={27} aria-hidden="true" /><p style={{ marginTop: 14 }}>Care is a control surface. Reversibility is a form of respect. Oversight without a route for affected people is only theater.</p><Link className="button-secondary" style={{ marginTop: 15, color: "var(--paper)", borderColor: "var(--paper)" }} href="/method">See the principles <ArrowUpRight size={15} aria-hidden="true" /></Link></div></div>
      </section>

      <section className="section-block" id="signals">
        <div className="section-heading"><div><span className="eyebrow">Evidence, not vibes</span><h2 className="section-title">A live signal beside a durable decision.</h2></div><p className="section-lede">Public research and governance signals are normalized into one feed. If the network is quiet, sealed offline samples keep the demo honest and useful.</p></div>
        <SignalFeed />
      </section>

      <section className="section-block" id="features">
        <div className="section-heading"><div><span className="eyebrow">What ships</span><h2 className="section-title">A small system with serious edges.</h2></div><p className="section-lede">The architecture is intentionally inspectable: one scoring function, one persistence contract, one MCP surface, and an audit trail you can recompute.</p></div>
        <div className="feature-grid">
          <article className="feature-card"><span className="feature-icon"><Network size={20} aria-hidden="true" /></span><h3>Relational scoring</h3><p>Five weighted factors turn autonomy, reversibility, oversight, impact, and voice into an explainable 0–100 signal.</p></article>
          <article className="feature-card"><span className="feature-icon"><Fingerprint size={20} aria-hidden="true" /></span><h3>Replayable evidence</h3><p>Every case revision is chained with SHA-384, preserving the previous digest and a human-readable history.</p></article>
          <article className="feature-card"><span className="feature-icon"><Workflow size={20} aria-hidden="true" /></span><h3>Agent-ready</h3><p>The same REST resources and JSON-RPC tools are available to a browser, a script, or a coding agent.</p></article>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">Start somewhere concrete</span><h2 className="section-title">A governance ritual, not a governance ornament.</h2></div><p className="section-lede">Create a case in under a minute, invite a critical reader, and keep the disagreement attached to the decision.</p></div>
        <div className="hero-actions"><Link className="button-primary" href="/ledger?new=1">Create a case <ArrowUpRight size={17} aria-hidden="true" /></Link><Link className="button-secondary" href="/agent">Try the agent console <ArrowDownRight size={16} aria-hidden="true" /></Link></div>
      </section>
    </div>
  );
}
