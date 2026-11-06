import { test, expect } from "@fixtures/test";
import type { LanguageName } from "@pages/Header";
import { frames } from "@data/frames";
import { results } from "@data/results";

/**
 * Bachyl's rule: every screen fits a 320 px phone in all three languages.
 * A row wider than the screen makes the browser zoom the whole page out.
 * The page root has `overflow-x: clip` as a safety net, which would also hide a
 * new overflow, so the check measures elements, not the document's scroll width.
 * An element is fine when it is meant to stick out: decoration that ignores the
 * pointer (background glows), or content inside a scroller (the Trending carousel)
 * or inside a box that hides its own overflow. Only the root's `clip` excuses nothing.
 */
const overflowingElements = () => {
  const intended = (el: HTMLElement) => {
    if (getComputedStyle(el).pointerEvents === "none") return true;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      if (["auto", "scroll", "hidden"].includes(getComputedStyle(a).overflowX)) return true;
    }
    return false;
  };
  return [...document.querySelectorAll<HTMLElement>("body *")]
    .filter((el) => {
      const box = el.getBoundingClientRect();
      return box.width > 0 && el.offsetParent !== null && box.right > window.innerWidth + 1 && !intended(el);
    })
    .slice(0, 5)
    .map(
      (el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}: ${el.innerText.trim().slice(0, 40)}`,
    );
};

const languages: LanguageName[] = ["English", "Русский", "Беларуская"];

test.describe("Narrow phone (320 px)", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const language of languages) {
    test(
      `home screen fits in ${language}`,
      { tag: ["@regression", "@layout"] },
      async ({ home, header, page }) => {
        await home.open();
        await header.switchLanguage(language);

        expect(await page.evaluate(overflowingElements)).toEqual([]);
      },
    );

    test(
      `result screen fits in ${language}`,
      { tag: ["@regression", "@layout"] },
      async ({ home, header, scan, result, page }) => {
        scan.answer(
          results.unsure({
            title: "An Exceptionally Long Localized Release Title For A Narrow Screen",
            director_or_studio: "dir. Someone With A Very Long Double-Barrelled Name",
          }),
        );
        await home.open();
        await header.switchLanguage(language);

        await home.identify(frames.pngFile());
        await expect(result.title).toBeVisible();

        expect(await page.evaluate(overflowingElements)).toEqual([]);
      },
    );
  }
});
