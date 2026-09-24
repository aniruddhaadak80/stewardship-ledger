import Link from "next/link";
import { Fingerprint, HeartHandshake, ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div>
          <div className="footer-kicker">
            <span className="footer-glyph"><HeartHandshake size={17} aria-hidden="true" /></span>
            Care before capability
          </div>
           <p className="footer-note">A public evidence atlas and working surface for making powerful systems more answerable to the people they touch.</p>
        </div>
        <div className="footer-links">
          <Link href="/atlas">Evidence atlas <span>↗</span></Link>
          <Link href="/briefs">Saved briefs <span>↗</span></Link>
          <Link href="/ledger">Open ledger <span>↗</span></Link>
          <Link href="/api/health">Health <span>↗</span></Link>
           <Link href="/api/feed">Research feed <span>↗</span></Link>
           <Link href="/api/research">Evidence API <span>↗</span></Link>
          <Link href="/mcp">MCP endpoint <span>↗</span></Link>
        </div>
        <div className="footer-seal">
          <ShieldCheck size={22} aria-hidden="true" />
          <span>SHA-384 evidence chain</span>
          <Fingerprint size={18} aria-hidden="true" />
        </div>
      </div>
      <div className="footer-bottom">
        <span>Stewardship Ledger · MIT licensed</span>
        <span>Educational governance tool, not a deployment certification.</span>
      </div>
    </footer>
  );
}
