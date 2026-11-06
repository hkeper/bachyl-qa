import { test, expect } from "@playwright/test";
import {
  evaluate,
  isRegression,
  isTop1,
  isTop3,
  normalizeTitle,
  percentile,
} from "../../src/ai-eval/metrics";
import type { EvalAnswer, EvalCase } from "../../src/ai-eval/metrics";

/**
 * Unit tests for the evaluation maths. A metric that is computed wrong is worse
 * than no metric, so the scorer is checked on hand-made cases before it is
 * trusted with real nightly results. No network, no AI calls.
 */
const movie = (
  id: string,
  title: string,
  year: number,
  difficulty: EvalCase["difficulty"] = "easy",
): EvalCase => ({
  id,
  expected: { title, year },
  type: "movie",
  difficulty,
});
const answer = (caseId: string, o: Partial<EvalAnswer> = {}): EvalAnswer => ({
  caseId,
  recognized: true,
  confidence: 90,
  latencyMs: 10_000,
  ...o,
});

test.describe("Title matching", () => {
  test("ignores case, accents, punctuation and a leading article", { tag: "@unit" }, () => {
    expect(normalizeTitle("The Amélie: Story!")).toBe(normalizeTitle("amelie story"));
    expect(normalizeTitle("Fast & Furious")).toBe(normalizeTitle("Fast and Furious"));
  });

  test("keeps non-Latin scripts", { tag: "@unit" }, () => {
    expect(normalizeTitle("Москва слезам не верит")).toBe("москва слезам не верит");
  });

  test("accepts the original title and a year off by one", { tag: "@unit" }, () => {
    const c = movie("1", "Spirited Away", 2001);

    expect(
      isTop1(c, answer("1", { title: "Унесённые призраками", original_title: "Spirited Away", year: 2002 })),
    ).toBe(true);
    expect(isTop1(c, answer("1", { title: "Spirited Away", year: 2005 }))).toBe(false);
  });

  test("an unrecognized answer is never top-1, but its candidates count for top-3", { tag: "@unit" }, () => {
    const c = movie("1", "Heat", 1995);
    const a = answer("1", {
      recognized: false,
      alternates: [{ title: "Ronin" }, { title: "Heat", year: 1995 }],
    });

    expect(isTop1(c, a)).toBe(false);
    expect(isTop3(c, a)).toBe(true);
  });

  test("top-3 looks at the answer and the first two alternates only", { tag: "@unit" }, () => {
    const c = movie("1", "Heat", 1995);
    const a = answer("1", {
      title: "Ronin",
      alternates: [{ title: "Collateral" }, { title: "Thief" }, { title: "Heat" }],
    });

    expect(isTop3(c, a)).toBe(false);
  });
});

test.describe("Report", () => {
  const cases = [
    movie("a", "Alpha", 2000),
    movie("b", "Beta", 2001),
    movie("c", "Gamma", 2002, "hard"),
    movie("d", "Delta", 2003, "hard"),
  ];
  const answers = [
    answer("a", { title: "Alpha", year: 2000, confidence: 95, latencyMs: 8_000 }),
    answer("b", { title: "Beta", year: 2001, confidence: 85, latencyMs: 12_000 }),
    answer("c", { title: "Wrong", confidence: 90, latencyMs: 20_000, alternates: [{ title: "Gamma" }] }),
    answer("d", { recognized: false, confidence: 20, latencyMs: 40_000 }),
  ];
  const report = evaluate(cases, answers);

  test("computes top-1 and top-3", { tag: "@unit" }, () => {
    expect(report.top1).toBe(0.5);
    expect(report.top3).toBe(0.75);
  });

  test("counts a wrong answer at >= 75% as a confident error", { tag: "@unit" }, () => {
    expect(report.confidentErrorRate).toBe(0.25);
  });

  test("splits accuracy by difficulty", { tag: "@unit" }, () => {
    expect(report.byDifficulty).toEqual({ easy: { total: 2, top1: 1 }, hard: { total: 2, top1: 0 } });
  });

  test("reports latency percentiles", { tag: "@unit" }, () => {
    expect(report.latency).toEqual({ p50: 12_000, p95: 40_000 });
    expect(percentile([], 50)).toBe(0);
  });

  test("calibration error is 0 when confidence equals accuracy", { tag: "@unit" }, () => {
    const perfect = evaluate([movie("a", "Alpha", 2000)], [answer("a", { title: "Alpha", confidence: 100 })]);

    expect(perfect.expectedCalibrationError).toBe(0);
    expect(report.expectedCalibrationError).toBeGreaterThan(0);
  });

  test("a missing answer is an error, not a silent skip", { tag: "@unit" }, () => {
    expect(() => evaluate(cases, answers.slice(1))).toThrow("No answer for case a");
  });

  test("a drop of more than 5 points is a regression, 5 or less is not", { tag: "@unit" }, () => {
    expect(isRegression({ ...report, top1: 0.44 }, report)).toBe(true);
    expect(isRegression({ ...report, top1: 0.45 }, report)).toBe(false);
  });
});
