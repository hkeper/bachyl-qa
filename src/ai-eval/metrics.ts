/**
 * Accuracy metrics for the nightly AI evaluation (docs/ai-quality.md).
 * Pure functions over (expected, answered) pairs, so they are tested without
 * calling the AI at all (tests/ai-eval/metrics.spec.ts).
 */

export interface EvalCase {
  id: string;
  expected: { title: string; year?: number; aliases?: string[] };
  type: "movie" | "series" | "anime";
  difficulty: "easy" | "medium" | "hard";
}

export interface EvalAnswer {
  caseId: string;
  recognized: boolean;
  title?: string;
  original_title?: string;
  year?: number;
  confidence: number;
  alternates?: { title: string; original_title?: string; year?: number }[];
  latencyMs: number;
  model?: string;
}

export interface EvalReport {
  total: number;
  top1: number;
  top3: number;
  /** Wrong answers given with confidence >= threshold: the most harmful case. */
  confidentErrorRate: number;
  /** Mean |confidence - accuracy| over confidence buckets, weighted by size (0 = perfectly calibrated). */
  expectedCalibrationError: number;
  latency: { p50: number; p95: number };
  byType: Record<string, { total: number; top1: number }>;
  byDifficulty: Record<string, { total: number; top1: number }>;
}

/** Titles match after case, accents, punctuation and a leading article are ignored. */
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/^(the|a|an) /, "");
}

function matches(
  expected: EvalCase["expected"],
  candidate: { title?: string; original_title?: string; year?: number },
) {
  const names = [expected.title, ...(expected.aliases ?? [])].map(normalizeTitle);
  const given = [candidate.title, candidate.original_title]
    .filter((t): t is string => Boolean(t))
    .map(normalizeTitle);
  const titleOk = given.some((g) => names.includes(g));
  // A year off by one is accepted: release vs. festival year, or a series' first season.
  const yearOk =
    expected.year === undefined ||
    candidate.year === undefined ||
    Math.abs(expected.year - candidate.year) <= 1;
  return titleOk && yearOk;
}

export function isTop1(c: EvalCase, a: EvalAnswer): boolean {
  return a.recognized && matches(c.expected, a);
}

export function isTop3(c: EvalCase, a: EvalAnswer): boolean {
  const candidates = [...(a.recognized ? [a] : []), ...(a.alternates ?? [])].slice(0, 3);
  return candidates.some((candidate) => matches(c.expected, candidate));
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((x, y) => x - y);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(Math.max(rank, 0), sorted.length - 1)] ?? 0;
}

const ratio = (part: number, whole: number) => (whole === 0 ? 0 : part / whole);

export function evaluate(cases: EvalCase[], answers: EvalAnswer[], confidentThreshold = 75): EvalReport {
  const answerById = new Map(answers.map((a) => [a.caseId, a]));
  const rows = cases.map((c) => {
    const a = answerById.get(c.id);
    if (!a) throw new Error(`No answer for case ${c.id}`);
    return { c, a, top1: isTop1(c, a), top3: isTop3(c, a) };
  });

  const group = (key: "type" | "difficulty") => {
    const out: Record<string, { total: number; top1: number }> = {};
    for (const { c, top1 } of rows) {
      const g = (out[c[key]] ??= { total: 0, top1: 0 });
      g.total += 1;
      g.top1 += top1 ? 1 : 0;
    }
    for (const g of Object.values(out)) g.top1 = ratio(g.top1, g.total);
    return out;
  };

  // Calibration: bucket answers by stated confidence (0-9, 10-19, ... 90-100).
  const buckets = new Map<number, { conf: number; correct: number; n: number }>();
  for (const { a, top1 } of rows) {
    const key = Math.min(Math.floor(a.confidence / 10), 9);
    const b = buckets.get(key) ?? { conf: 0, correct: 0, n: 0 };
    b.conf += a.confidence / 100;
    b.correct += top1 ? 1 : 0;
    b.n += 1;
    buckets.set(key, b);
  }
  const ece = [...buckets.values()].reduce(
    (sum, b) => sum + (b.n / rows.length) * Math.abs(b.conf / b.n - b.correct / b.n),
    0,
  );

  const latencies = rows.map(({ a }) => a.latencyMs);
  return {
    total: rows.length,
    top1: ratio(rows.filter((r) => r.top1).length, rows.length),
    top3: ratio(rows.filter((r) => r.top3).length, rows.length),
    confidentErrorRate: ratio(
      rows.filter(({ a, top1 }) => a.recognized && !top1 && a.confidence >= confidentThreshold).length,
      rows.length,
    ),
    expectedCalibrationError: rows.length ? ece : 0,
    latency: { p50: percentile(latencies, 50), p95: percentile(latencies, 95) },
    byType: group("type"),
    byDifficulty: group("difficulty"),
  };
}

/** The nightly run turns red when top-1 drops more than `maxDropPoints` percentage points below the baseline. */
export function isRegression(current: EvalReport, baseline: EvalReport, maxDropPoints = 5): boolean {
  // Rounded to 0.1 point so floating-point noise (0.5 - 0.45 = 0.04999…) never decides.
  return Math.round((baseline.top1 - current.top1) * 1000) / 10 > maxDropPoints;
}
