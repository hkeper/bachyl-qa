import { test, expect } from "@fixtures/test";
import type { LanguageName } from "@pages/Header";

const languages: { name: LanguageName; code: string; heading: string }[] = [
  { name: "English", code: "EN", heading: "Identify Any Movie, Show, or Anime" },
  { name: "Русский", code: "RU", heading: "Определите любой фильм, сериал или аниме" },
  { name: "Беларуская", code: "BE", heading: "Вызначце любы фільм, серыял ці анімэ" },
];

test.describe("Language", () => {
  test(
    "follows the browser language on first visit",
    { tag: ["@smoke", "@i18n"] },
    async ({ browser, baseURL }) => {
      const context = await browser.newContext({ locale: "ru-RU", baseURL });
      const page = await context.newPage();

      await page.goto("/");

      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Определите любой фильм, сериал или аниме",
      );
      await expect(page.locator("#header-language-toggle-btn")).toContainText("RU");
      await context.close();
    },
  );

  test(
    "an unsupported browser language falls back to English",
    { tag: "@i18n" },
    async ({ browser, baseURL }) => {
      const context = await browser.newContext({ locale: "ja-JP", baseURL });
      const page = await context.newPage();

      await page.goto("/");

      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Identify Any Movie, Show, or Anime");
      await context.close();
    },
  );

  for (const language of languages) {
    test(
      `switching to ${language.name} translates the screen and survives a reload`,
      { tag: "@i18n" },
      async ({ home, header, page }) => {
        await home.open();

        await header.switchLanguage(language.name);

        await expect(header.languageButton).toContainText(language.code);
        await expect(home.heading).toHaveText(language.heading);
        await expect(page.locator("html")).not.toContainText(/\b[a-z]+\.[a-zA-Z]+[A-Z][a-zA-Z]*\b/); // no raw i18n keys like "home.uploadImage"

        await page.reload();
        await expect(header.languageButton).toContainText(language.code);
      },
    );
  }
});
