import { BriefsClient } from "@/components/BriefsClient";

export const metadata = {
  title: "Saved evidence briefs",
  description: "Create, inspect, revise, and archive sealed plain-language alignment evidence briefs.",
};

export default function BriefsPage() {
  return <BriefsClient />;
}
