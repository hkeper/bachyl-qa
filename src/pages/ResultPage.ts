import type { Locator, Page } from "@playwright/test";

export class ResultPage {
  readonly title: Locator;
  readonly confidenceBadge: Locator;
  readonly unsureLabel: Locator;
  readonly candidatesBlock: Locator;
  readonly nativeTitle: Locator;
  readonly backButton: Locator;
  readonly searchAgainButton: Locator;
  readonly shareButton: Locator;
  readonly feedback: {
    root: Locator;
    correct: Locator;
    wrong: Locator;
    suggest: Locator;
    input: Locator;
    send: Locator;
    thanks: Locator;
  };

  constructor(private readonly page: Page) {
    this.title = page.getByRole("heading", { level: 1 });
    this.confidenceBadge = page.getByText(/^\d{1,3}% match$|^Not sure · \d{1,3}%$/);
    this.unsureLabel = page.getByText(/^Not sure · \d{1,3}%$/);
    this.candidatesBlock = page.getByText(/^(Or it might be|It might be):$/);
    this.nativeTitle = page.locator("#result-native-title");
    this.backButton = page.getByRole("button", { name: "Back" });
    this.searchAgainButton = page.getByRole("button", { name: "Search again" });
    this.shareButton = page.locator("#result-share-btn");
    this.feedback = {
      root: page.locator("#result-feedback"),
      correct: page.locator("#result-feedback-correct-btn"),
      wrong: page.locator("#result-feedback-wrong-btn"),
      suggest: page.locator("#result-feedback-suggest-btn"),
      input: page.locator("#result-feedback-input"),
      send: page.locator("#result-feedback-send-btn"),
      thanks: page.locator("#result-feedback-thanks"),
    };
  }

  candidate(title: string): Locator {
    return this.page.getByText(title, { exact: true });
  }
}
