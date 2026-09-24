import Link from "next/link";

export default function NotFound() {
  return <div className="page-frame"><div className="not-found"><div><h1>404</h1><p>That page is not part of the public casebook.</p><Link className="button-primary" href="/">Return home</Link></div></div></div>;
}
