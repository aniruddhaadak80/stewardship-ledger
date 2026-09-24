"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="page-frame"><div className="not-found"><div><TriangleAlert size={35} aria-hidden="true" /><h1>Something slipped.</h1><p>The casebook could not render this view. The public API may still be available.</p><button className="button-primary" type="button" onClick={() => reset()}><RotateCcw size={16} aria-hidden="true" /> Try again</button></div></div></div>;
}
