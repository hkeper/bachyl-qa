import { test, expect } from "@fixtures/test";
import { frames } from "@data/frames";
import { results } from "@data/results";

test.describe("Result feedback", () => {
  test.beforeEach(async ({ home }) => {
    await home.open();
  });

  test(
    "'Correct' sends the verdict for this scan and thanks the user",
    { tag: ["@smoke", "@web"] },
    async ({ home, scan, feedback, result }) => {
      const answer = results.confident();
      scan.answer(answer);
      await home.identify(frames.pngFile());

      await result.feedback.correct.click();

      await expect(result.feedback.thanks).toBeVisible();
      expect(feedback.requests).toEqual([
        expect.objectContaining({ scanId: answer.scan_id, verdict: "correct" }),
      ]);
    },
  );

  test(
    "'Not it' with a correction sends the title the user typed",
    { tag: "@regression" },
    async ({ home, scan, feedback, result }) => {
      const answer = results.confident();
      scan.answer(answer);
      await home.identify(frames.pngFile());

      await result.feedback.wrong.click();
      await result.feedback.input.fill("The Loud Harbour");
      await result.feedback.send.click();

      await expect(result.feedback.thanks).toBeVisible();
      expect(feedback.requests[0]).toMatchObject({
        scanId: answer.scan_id,
        verdict: "wrong",
        correction: "The Loud Harbour",
      });
    },
  );

  test(
    "a demo answer (no scan id) asks for no feedback",
    { tag: "@regression" },
    async ({ home, scan, result }) => {
      scan.answer(results.confident({ scan_id: undefined, isDemo: true }));
      await home.identify(frames.pngFile());

      await expect(result.title).toBeVisible();
      await expect(result.feedback.root).toBeHidden();
    },
  );
});
