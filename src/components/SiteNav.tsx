import Link from "next/link";
import { ArrowUpRight, BookOpen, Plus, Sparkles } from "lucide-react";

export function SiteNav() {
  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <Link className="brand-lockup" href="/" aria-label="Stewardship Ledger home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>Stewardship</strong>
            <small>Atlas / public casebook</small>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/atlas">Evidence atlas</Link>
          <Link href="/briefs">Briefs</Link>
          <Link href="/ledger">The ledger</Link>
          <Link href="/method">Method</Link>
          <Link href="/agent">Agent console</Link>
          <Link className="nav-cta" href="/ledger?new=1">
            <Plus size={16} aria-hidden="true" />
            Add a case
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </nav>
        <div className="nav-status" aria-label="Public casebook status">
          <span className="status-dot" aria-hidden="true" />
          Public / live
        </div>
      </div>
    </header>
  );
}

export function NavIcon() {
  return <Sparkles aria-hidden="true" />;
}

export function NavBookIcon() {
  return <BookOpen aria-hidden="true" />;
}
