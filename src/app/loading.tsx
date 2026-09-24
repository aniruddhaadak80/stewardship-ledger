import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return <div className="page-frame"><div className="loading-shell"><LoaderCircle className="spin" size={20} aria-hidden="true" /> Loading the public atlas and casebook…</div></div>;
}
