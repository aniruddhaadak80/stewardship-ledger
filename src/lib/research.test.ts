import { describe, expect, it } from "vitest";
import { canonicalJson } from "./canonical";
import { buildAlignmentBrief } from "./brief-engine";
import { evaluateCase, normalizeCase } from "./engine";
import { CURATED_COMMENTARY, CURATED_SOURCES } from "./research-catalog";
import { buildSeedRecord, createSeal, verifySeal, verifySealChain } from "./seals";
import type { CaseFields } from "./types";

describe("canonicalJson", () => {
  it("sorts object keys without changing array order", () => {
    expect(canonicalJson({ z: 1, a: [{ y: 2, x: 1 }] })).toBe('{"a":[{"x":1,"y":2}],"z":1}');
  });
});

describe("research catalog", () => {
  it("contains unique, attributable records with valid source URLs", () => {
    const ids = CURATED_SOURCES.map((source) => source.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CURATED_SOURCES.length).toBeGreaterThan(20);
    for (const source of CURATED_SOURCES) {
      expect(source.title.length).toBeGreaterThan(8);
      expect(source.publisher.length).toBeGreaterThan(1);
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.keyClaim.length).toBeGreaterThan(10);
      expect(source.limitations.length).toBeGreaterThan(10);
      expect(source.topics.length).toBeGreaterThan(0);
    }
  });

  it("keeps commentary attached to catalogued sources", () => {
    const sourceIds = new Set(CURATED_SOURCES.map((source) => source.id));
    expect(CURATED_COMMENTARY.length).toBeGreaterThan(5);
    for (const lens of CURATED_COMMENTARY) {
      expect(sourceIds.has(lens.sourceId)).toBe(true);
      expect(lens.url).toMatch(/^https:\/\//);
      expect(lens.counterpoint.length).toBeGreaterThan(10);
    }
  });
});

describe("alignment brief engine", () => {
  it("returns an explicit evidence gap for an empty selection", () => {
    const brief = buildAlignmentBrief([], "What should we verify?", "Empty brief");
    expect(brief.sourceIds).toEqual([]);
    expect(brief.evidenceScore).toBe(0);
    expect(brief.coverage).toBe(0);
    expect(brief.confidence).toBe("low");
    expect(brief.unsettled.length).toBeGreaterThan(0);
  });

  it("is deterministic and preserves source provenance", () => {
    const selected = CURATED_SOURCES.slice(0, 5);
    const first = buildAlignmentBrief(selected, "How should an agent be evaluated?", "Evidence check");
    const second = buildAlignmentBrief([...selected].reverse(), "How should an agent be evaluated?", "Evidence check");
    expect(first).toEqual(second);
    expect(first.sourceIds).toEqual([...selected].map((source) => source.id).sort());
    expect(first.actionSteps.length).toBeGreaterThan(0);
    expect(first.themes.some((theme) => theme.sourceCount > 0)).toBe(true);
  });
});

describe("case engine and seals", () => {
  it("normalizes and scores a bounded case", () => {
    const normalized = normalizeCase({ title: "  Safe test  ", autonomy: 140, reversibility: -20, oversight: "80" as unknown as number });
    expect(normalized.title).toBe("Safe test");
    expect(normalized.autonomy).toBe(100);
    expect(normalized.reversibility).toBe(0);
    expect(normalized.oversight).toBe(80);
    expect(evaluateCase(normalized).factors).toHaveLength(5);
  });

  it("verifies a record and a multi-record revision chain", () => {
    const input: CaseFields = {
      title: "Seal test",
      system: "Test agent",
      context: "A deterministic test case.",
      autonomy: 40,
      reversibility: 70,
      oversight: 65,
      affected: 35,
      voice: 75,
      safeguards: "Pause, review, and reverse.",
      owner: "Test steward",
    };
    const first = buildSeedRecord(input, "case-a", "2026-01-01T00:00:00.000Z", "0".repeat(96));
    const second = buildSeedRecord({ ...input, title: "Second seal test" }, "case-b", "2026-01-02T00:00:00.000Z", first.seal.digest);
    expect(verifySeal(first)).toBe(true);
    expect(verifySeal({ ...first, title: "Tampered" })).toBe(false);
    expect(verifySealChain([first, second])).toEqual({ valid: true, checked: 2, brokenAt: null, head: second.seal.digest });
  });

  it("uses a stable digest for equivalent canonical input", () => {
    const input: CaseFields = {
      title: "Digest test",
      system: "Agent",
      context: "Context",
      autonomy: 1,
      reversibility: 2,
      oversight: 3,
      affected: 4,
      voice: 5,
      safeguards: "Stop",
      owner: "Owner",
    };
    const score = evaluateCase(input);
    expect(createSeal(input, score, "0".repeat(96), "2026-01-01T00:00:00.000Z").digest).toBe(createSeal({ ...input }, score, "0".repeat(96), "2026-01-01T00:00:00.000Z").digest);
  });
});
