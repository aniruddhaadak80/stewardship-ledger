import Link from "next/link";

export default function NotFound() {
  return <div className="page-frame"><div className="not-found"><div><h1>404</h1><p>That page is not part of the public evidence atlas or casebook.</p><Link className="button-primary" href="/atlas">Open the evidence atlas</Link></div></div></div>;
}
