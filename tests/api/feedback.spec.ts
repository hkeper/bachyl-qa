import { test, expect } from "@fixtures/test";
import { z } from "zod";
import { feedbackResponseSchema } from "@schemas/catalog";
import { apiErrorSchema } from "@schemas/recognition";

/**
 * With the scan log on (Firestore), an unknown scan is a 404 unknown_scan. Without it
 * the tap still succeeds with stored: false: a storage problem on our side must not
 * show the user an error. Both are valid; anything else is not.
 */
const unknownScanAnswer = z.union([
  feedbackResponseSchema.extend({ stored: z.literal(false) }),
  apiErrorSchema.extend({ code: z.literal("unknown_scan") }),
]);

const unknownScanId = "00000000-0000-4000-8000-000000000000";

test.describe("POST /api/feedback", () => {
  test("accepts a 'correct' verdict", { tag: ["@smoke", "@api"] }, async ({ api }) => {
    const response = await api.feedback({ scanId: unknownScanId, verdict: "correct" });

    expect([200, 404]).toContain(response.status());
    unknownScanAnswer.parse(await response.json());
  });

  test("accepts a 'wrong' verdict with a correction", { tag: "@regression" }, async ({ api }) => {
    const response = await api.feedback({
      scanId: unknownScanId,
      verdict: "wrong",
      correction: "Another Film",
    });

    expect([200, 404]).toContain(response.status());
    unknownScanAnswer.parse(await response.json());
  });

  const invalid: [string, Record<string, unknown>][] = [
    ["no scan id", { verdict: "correct" }],
    ["a scan id that isn't a uuid", { scanId: "scan-1", verdict: "correct" }],
    ["an unknown verdict", { scanId: unknownScanId, verdict: "maybe" }],
    ["a verdict of the wrong type", { scanId: unknownScanId, verdict: true }],
    ["an empty body", {}],
  ];
  for (const [name, body] of invalid) {
    test(`400 invalid_feedback for ${name}`, { tag: "@negative" }, async ({ api }) => {
      const response = await api.feedback(body);

      expect(response.status()).toBe(400);
      expect(apiErrorSchema.parse(await response.json()).code).toBe("invalid_feedback");
    });
  }

  test("a very long correction doesn't fail the request", { tag: "@negative" }, async ({ api }) => {
    const response = await api.feedback({
      scanId: unknownScanId,
      verdict: "wrong",
      correction: "x".repeat(10_000),
    });

    expect(response.status()).toBeLessThan(500);
  });
});
