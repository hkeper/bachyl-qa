import { test, expect } from "@fixtures/test";
import { LimitDialog } from "@pages/LimitDialog";
import { frames } from "@data/frames";
import { errors } from "@data/results";

test.describe("Daily limit", () => {
  test(
    "a 429 limit_reached opens the limit dialog instead of an error",
    { tag: ["@smoke", "@monetization"] },
    async ({ home, scan, page }) => {
      const limit = new LimitDialog(page);
      scan.fail(errors.limitReached);
      await home.open();

      await home.identify(frames.pngFile());

      await expect(limit.root).toBeVisible();
      await expect(limit.root).toContainText("You've used all 5 free searches for today");
    },
  );

  test(
    "the limit dialog can be closed and the home screen is usable again",
    { tag: "@regression" },
    async ({ home, scan, page }) => {
      const limit = new LimitDialog(page);
      scan.fail(errors.limitReached);
      await home.open();
      await home.identify(frames.pngFile());
      await expect(limit.root).toBeVisible();

      await limit.closeButton.click();

      await expect(limit.root).toBeHidden();
      await expect(home.heading).toBeVisible();
    },
  );
});
