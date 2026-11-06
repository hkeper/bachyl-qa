import { test, expect } from "@fixtures/test";
import { frames } from "@data/frames";
import { errors, results } from "@data/results";

test.describe("Scan → result", () => {
  test.beforeEach(async ({ home }) => {
    await home.open();
  });

  test(
    "a confident answer shows title, year and match %",
    { tag: ["@smoke", "@web"] },
    async ({ home, scan, result }) => {
      scan.answer(results.confident({ title: "The Quiet Harbour", year: 2019, confidence: 93 }));

      await home.identify(frames.pngFile());

      await expect(result.title).toHaveText("The Quiet Harbour");
      await expect(result.confidenceBadge).toHaveText("93% match");
      await expect(result.unsureLabel).toBeHidden();
      await expect(result.candidatesBlock).toBeHidden();
    },
  );

  test(
    "the app sends the image as base64 with the UI locale",
    { tag: "@regression" },
    async ({ home, scan, result }) => {
      scan.answer(results.confident());

      await home.identify(frames.pngFile());
      await expect(result.title).toBeVisible();

      const sent = scan.requests[0] ?? {};
      expect(String(sent.imageBase64)).toMatch(/^(data:image\/[a-z]+;base64,)?[A-Za-z0-9+/=]+$/);
      expect(sent.locale).toBe("en");
    },
  );

  test(
    "the hint typed by the user reaches the server",
    { tag: "@regression" },
    async ({ home, scan, result }) => {
      scan.answer(results.confident());

      await home.chooseFrame(frames.pngFile());
      await home.hintInput.fill("1990s, Keanu Reeves");
      await home.identifyButton.click();
      await expect(result.title).toBeVisible();

      expect(scan.requests[0]?.userHint).toBe("1990s, Keanu Reeves");
    },
  );

  test(
    "below 75% the answer is 'Not sure' and candidates are listed",
    { tag: ["@smoke", "@web"] },
    async ({ home, scan, result }) => {
      scan.answer(results.unsure({ confidence: 55 }));

      await home.identify(frames.pngFile());

      await expect(result.unsureLabel).toHaveText("Not sure · 55%");
      await expect(result.candidatesBlock).toBeVisible();
      await expect(result.candidate("Graveyard Hours")).toBeVisible();
      await expect(result.candidate("The Last Tram")).toBeVisible();
    },
  );

  test(
    "an unrecognized frame says so and offers to suggest the title",
    { tag: "@regression" },
    async ({ home, scan, result }) => {
      scan.answer(results.unrecognized());

      await home.identify(frames.pngFile());

      await expect(result.title).toHaveText("Unknown Match");
      await expect(result.confidenceBadge).toBeHidden();
    },
  );

  test(
    "an anime answer shows its native title under the English one",
    { tag: "@regression" },
    async ({ home, scan, result }) => {
      scan.answer(results.anime());

      await home.identify(frames.pngFile());

      await expect(result.title).toHaveText("Skyward Lanterns");
      await expect(result.nativeTitle).toHaveText("空の灯籠");
    },
  );

  test(
    "'Search again' returns to an empty home screen",
    { tag: "@regression" },
    async ({ home, scan, result }) => {
      scan.answer(results.confident());
      await home.identify(frames.pngFile());
      await expect(result.title).toBeVisible();

      await result.searchAgainButton.click();

      await expect(home.heading).toHaveText("Identify Any Movie, Show, or Anime");
      await expect(home.identifyButton).toBeHidden();
    },
  );

  test.describe("errors stay on the home screen with a readable message", () => {
    const cases = [
      { name: "AI overloaded (503)", error: errors.aiOverloaded, message: /high traffic/ },
      {
        name: "unsafe image (400)",
        error: errors.unsafeContent,
        message: /flagged as inappropriate content/,
      },
      { name: "network limit (429)", error: errors.ipLimit, message: /Too many searches from this network/ },
      {
        name: "device not verified (401)",
        error: errors.authRequired,
        message: /Couldn't verify this device/,
      },
    ];
    for (const { name, error, message } of cases) {
      test(name, { tag: ["@regression", "@negative"] }, async ({ home, scan, page }) => {
        scan.fail(error);

        await home.identify(frames.pngFile());

        await expect(page.getByText(message)).toBeVisible();
        await expect(home.heading).toHaveText("Identify Any Movie, Show, or Anime");
        // The frame stays selected, so the user can retry with one tap.
        await expect(home.identifyButton).toBeEnabled();
      });
    }

    test(
      "an unknown 500 shows the generic message with its code",
      { tag: "@negative" },
      async ({ home, scan, page }) => {
        scan.fail({ status: 500, body: {} });

        await home.identify(frames.pngFile());

        await expect(page.getByText("Recognition error (code 500). Please try again.")).toBeVisible();
      },
    );
  });
});
