import type { Locator, Page } from "@playwright/test";

export class LimitDialog {
  readonly root: Locator;
  readonly closeButton: Locator;
  readonly getPremiumButton: Locator;
  readonly comeBackTomorrowButton: Locator;

  constructor(page: Page) {
    this.root = page.locator("#limit-screen-dialog");
    this.closeButton = page.locator("#close-limit-screen-btn");
    this.getPremiumButton = page.locator("#get-premium-limit-btn");
    this.comeBackTomorrowButton = page.locator("#come-back-tomorrow-limit-btn");
  }
}
