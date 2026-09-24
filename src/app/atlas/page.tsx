import { ResearchAtlasClient } from "@/components/ResearchAtlasClient";

export const metadata = {
  title: "Alignment evidence atlas",
  description: "Read primary AI safety research, frontier reports, podcasts, commentary, and attributable tools as a plain-language evidence brief.",
};

export default function AtlasPage() {
  return <ResearchAtlasClient />;
}
