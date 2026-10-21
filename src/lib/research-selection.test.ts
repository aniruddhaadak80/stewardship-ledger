import { describe, expect, it } from "vitest";
import { createBrief, normalizedSource, previewBrief } from "./research-db";
import { CURATED_SOURCES } from "./research-catalog";
import type { ResearchSource } from "./types";

describe("brief source selection", () => {
  it("honours an explicitly empty selection", async () => {
    const brief = await previewBrief([], "What should we verify?", "Empty brief");
    expect(brief.sourceIds).toEqual([]);
    expect(brief.coverage).toBe(0);
    expect(brief.evidenceScore).toBe(0);
    expect(brief.confidence).toBe("low");
    expect(brief.unsettled.length).toBeGreaterThan(0);
  });

  it("falls back to the whole catalog only when no selection is given", async () => {
    const brief = await previewBrief(undefined, "What should we verify?", "All brief");
    expect(brief.sourceIds.length).toBeGreaterThan(1);
  });

  it("keeps a saved brief empty when it is created with no sources", async () => {
    const record = await createBrief({ sourceIds: [], question: "What should we verify?", title: "Empty brief" });
    expect(record.sourceIds).toEqual([]);
    expect(record.coverage).toBe(0);
  });
});

describe("source fingerprint", () => {
  const base: ResearchSource = {
    id: "fingerprint-probe",
    kind: "paper",
    title: "A stable record",
    publisher: "Publisher",
    authors: "Authors",
    publishedAt: "2026-09-21T00:00:00.000Z",
    url: "https://example.org/paper",
    summary: "Summary",
    keyClaim: "Claim",
    limitations: "Limitations",
    topics: ["agents"],
    evidenceGrade: "primary",
    stance: "mixed",
    isLive: true,
    fetchedAt: "2026-09-21T00:00:00.000Z",
    sourceHash: "",
  };

  it("is stable when only the fetch timestamp changes", () => {
    const first = normalizedSource({ ...base, fetchedAt: "2026-09-21T00:00:00.000Z" });
    const second = normalizedSource({ ...base, fetchedAt: "2026-10-22T12:00:00.000Z" });
    expect(second.sourceHash).toBe(first.sourceHash);
  });

  it("changes when the content changes", () => {
    const first = normalizedSource(base);
    const second = normalizedSource({ ...base, title: "A changed record" });
    expect(second.sourceHash).not.toBe(first.sourceHash);
  });

  it("keeps the curated catalog stable", () => {
    const hashes = CURATED_SOURCES.map((source) => normalizedSource(source).sourceHash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });
});
