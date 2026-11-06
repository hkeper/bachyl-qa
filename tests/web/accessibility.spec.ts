import AxeBuilder from "@axe-core/playwright";
import type { Page, TestInfo } from "@playwright/test";
import { test, expect } from "@fixtures/test";
import { frames } from "@data/frames";
import { results } from "@data/results";

/**
 * Automated accessibility checks (axe-core, WCAG 2.1 A/AA). Serious and critical
 * violations fail the test, except the ones already reported, listed below with
 * their issue. A new violation fails; a fixed one makes the baseline shrink.
 * The full axe report is attached to every run.
 */
const knownViolations: Record<string, string[]> = {
  // Known bug: low contrast on small secondary text (paste tip, footer, "Sign in to keep
  // your history") and the Trending carousel can't be scrolled from the keyboard.
  home: ["color-contrast", "scrollable-region-focusable"],
  result: ["color-contrast"],
};

/** Screens fade in: measuring contrast mid-animation reports colours nobody sees. */
async function settleAnimations(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const finite = document
      .getAnimations()
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
  });
}

async function seriousViolations(page: Page, testInfo: TestInfo, screen: keyof typeof knownViolations) {
  await settleAnimations(page);
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  await testInfo.attach(`axe-${screen}.json`, {
    body: JSON.stringify(report.violations, null, 2),
    contentType: "application/json",
  });
  return report.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => v.id)
    .filter((id) => !knownViolations[screen]?.includes(id));
}

test.describe("Accessibility", () => {
  test("home screen has no new serious violations", { tag: "@a11y" }, async ({ home, page }, testInfo) => {
    await home.open();

    expect(await seriousViolations(page, testInfo, "home")).toEqual([]);
  });

  test(
    "result screen has no new serious violations",
    { tag: "@a11y" },
    async ({ home, scan, result, page }, testInfo) => {
      scan.answer(results.unsure());
      await home.open();
      await home.identify(frames.pngFile());
      await expect(result.title).toBeVisible();

      expect(await seriousViolations(page, testInfo, "result")).toEqual([]);
    },
  );
});
